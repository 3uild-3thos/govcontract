use std::str::FromStr;

use anchor_client::solana_sdk::{
    instruction::Instruction, pubkey::Pubkey, signer::Signer, transaction::Transaction,
};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use gov_v1::{ID as SNAPSHOT_PROGRAM_ID, MetaMerkleLeaf, MetaMerkleProof};
use log::info;

use crate::{
    constants::*,
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{
            convert_merkle_proof_strings, convert_stake_merkle_leaf_data_to_idl_type,
            generate_pdas_from_vote_proof_response, get_stake_account_proof,
            get_vote_account_proof,
        },
        utils::{
            create_spinner, derive_vote_override_cache_pda, derive_vote_override_pda,
            derive_vote_pda, setup_all_with_staker,
        },
    },
};

pub async fn cast_vote_override(
    proposal_id: String,
    ballot_id: u64,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    staker_keypair: String,
    rpc_url: Option<String>,
    _operator_api: Option<String>,
    stake_account_override: String,
    vote_account: String,
    snapshot_slot: u64,
    network: String,
) -> Result<()> {
    if for_votes + against_votes + abstain_votes != BASIS_POINTS_TOTAL {
        return Err(anyhow!(
            "Total vote basis points must sum to {}",
            BASIS_POINTS_TOTAL
        ));
    }

    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, program, merkle_proof_program) = setup_all_with_staker(staker_keypair, rpc_url)?;

    let stake_account_str = stake_account_override.clone();
    let vote_account_pubkey = Pubkey::from_str(&vote_account)
        .map_err(|_| anyhow!("Invalid vote account: {}", vote_account))?;

    let meta_merkle_proof = get_vote_account_proof(&vote_account, snapshot_slot, &network).await?;

    let stake_merkle_proof =
        get_stake_account_proof(&stake_account_str, snapshot_slot, &network).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(ballot_id, &meta_merkle_proof)?;

    let validator_vote_pda = derive_vote_pda(&proposal_pubkey, &vote_account_pubkey, &program.id());
    let vote_override_pda = derive_vote_override_pda(
        &proposal_pubkey,
        &Pubkey::from_str(&stake_account_str)?,
        &validator_vote_pda,
        &program.id(),
    );
    let vote_override_cache_pda =
        derive_vote_override_cache_pda(&proposal_pubkey, &validator_vote_pda, &program.id());

    let stake_merkle_proof_vec =
        convert_merkle_proof_strings(&stake_merkle_proof.stake_merkle_proof)?;

    let stake_merkle_leaf =
        convert_stake_merkle_leaf_data_to_idl_type(&stake_merkle_proof.stake_merkle_leaf)?;

    let spinner = create_spinner("Sending vote override transaction...");

    let mut ixs: Vec<Instruction> = vec![];

    // Check if meta merkle proof account exists, create if missing
    let meta_merkle_proof_account = match program
        .account::<MetaMerkleProof>(meta_merkle_proof_pda)
        .await
    {
        Ok(account) => Some(account),
        Err(_e) => {
            info!("Unable to get meta merkle proof account, will create it");
            None
        }
    };

    if meta_merkle_proof_account.is_none() {
        info!("Creating meta merkle proof account");

        let voting_wallet = Pubkey::from_str(&meta_merkle_proof.meta_merkle_leaf.voting_wallet)
            .map_err(|e| anyhow!("Invalid voting wallet in proof: {}", e))?;

        let init_meta_merkle_proof_ix = merkle_proof_program
            .request()
            .args(gov_v1::instruction::InitMetaMerkleProof {
                close_timestamp: 1,
                meta_merkle_leaf: MetaMerkleLeaf {
                    voting_wallet,
                    vote_account: vote_account_pubkey,
                    stake_merkle_root: Pubkey::from_str_const(
                        meta_merkle_proof
                            .meta_merkle_leaf
                            .stake_merkle_root
                            .as_str(),
                    )
                    .to_bytes(),
                    active_stake: meta_merkle_proof.meta_merkle_leaf.active_stake,
                },
                meta_merkle_proof: meta_merkle_proof
                    .meta_merkle_proof
                    .iter()
                    .map(|s| Pubkey::from_str_const(s).to_bytes())
                    .collect(),
            })
            .accounts(gov_v1::accounts::InitMetaMerkleProof {
                consensus_result: consensus_result_pda,
                merkle_proof: meta_merkle_proof_pda,
                payer: payer.pubkey(),
                system_program: system_program::ID,
            })
            .instructions()?;

        ixs.extend(init_meta_merkle_proof_ix);
    }

    let cast_vote_override_ixs = program
        .request()
        .args(args::CastVoteOverride {
            for_votes_bp: for_votes,
            against_votes_bp: against_votes,
            abstain_votes_bp: abstain_votes,
            stake_merkle_proof: stake_merkle_proof_vec,
            stake_merkle_leaf,
        })
        .accounts(accounts::CastVoteOverride {
            signer: payer.pubkey(),
            spl_vote_account: vote_account_pubkey,
            spl_stake_account: Pubkey::from_str(&stake_account_str)?,
            proposal: proposal_pubkey,
            validator_vote: validator_vote_pda,
            vote_override: vote_override_pda,
            vote_override_cache: vote_override_cache_pda,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .instructions()?;

    ixs.extend(cast_vote_override_ixs);

    let blockhash = program.rpc().get_latest_blockhash().await?;
    let transaction =
        Transaction::new_signed_with_payer(&ixs, Some(&payer.pubkey()), &[&payer], blockhash);

    let sig = program
        .rpc()
        .send_and_confirm_transaction(&transaction)
        .await?;

    spinner.finish_with_message(format!(
        "Vote override cast successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
