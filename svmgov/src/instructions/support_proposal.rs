use std::str::FromStr;

use anchor_client::solana_sdk::{
    instruction::Instruction, pubkey::Pubkey, signer::Signer, transaction::Transaction,
};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use gov_v1::{ID as SNAPSHOT_PROGRAM_ID, MetaMerkleLeaf, MetaMerkleProof};
use log::info;

use crate::{
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{generate_pdas_from_vote_proof_response, get_vote_account_proof},
        utils::{create_spinner, derive_support_pda, setup_all},
    },
};

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    ballot_id: u64,
    snapshot_slot: u64,
    network: String,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, vote_account, program, merkle_proof_program) =
        setup_all(identity_keypair, rpc_url).await?;

    let proof_response =
        get_vote_account_proof(&vote_account.to_string(), snapshot_slot, &network).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(ballot_id, &proof_response)?;

    let support_pda = derive_support_pda(&proposal_pubkey, &vote_account, &program.id());

    let spinner = create_spinner("Supporting proposal...");

    let meta_merkle_proof_account = match program
        .account::<MetaMerkleProof>(meta_merkle_proof_pda)
        .await
    {
        Ok(account) => Some(account),
        Err(_e) => {
            info!("Unable to get meta merkle proof account");
            None
        }
    };

    let voting_wallet = Pubkey::from_str(&proof_response.meta_merkle_leaf.voting_wallet)?;
    let mut ixs: Vec<Instruction> = vec![];

    if meta_merkle_proof_account.is_none() {
        info!("Creating meta merkle proof account");
        let init_meta_merkle_proof_ix = merkle_proof_program
            .request()
            .args(gov_v1::instruction::InitMetaMerkleProof {
                close_timestamp: 1,
                meta_merkle_leaf: MetaMerkleLeaf {
                    voting_wallet,
                    vote_account,
                    stake_merkle_root: Pubkey::from_str_const(
                        proof_response.meta_merkle_leaf.stake_merkle_root.as_str(),
                    )
                    .to_bytes(),
                    active_stake: proof_response.meta_merkle_leaf.active_stake,
                },
                meta_merkle_proof: proof_response
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

    let support_proposal_ixs = program
        .request()
        .args(args::SupportProposal {})
        .accounts(accounts::SupportProposal {
            signer: payer.pubkey(),
            proposal: proposal_pubkey,
            support: support_pda,
            spl_vote_account: vote_account,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .instructions()?;

    ixs.extend(support_proposal_ixs);

    let blockhash = program.rpc().get_latest_blockhash().await?;
    let transaction =
        Transaction::new_signed_with_payer(&ixs, Some(&payer.pubkey()), &[&payer], blockhash);

    let sig = program
        .rpc()
        .send_and_confirm_transaction(&transaction)
        .await?;

    spinner.finish_with_message(format!(
        "Proposal supported. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
