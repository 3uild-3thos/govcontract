use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer, transaction::Transaction};
use anchor_lang::system_program;
use anyhow::Result;
use gov_v1::{ID as SNAPSHOT_PROGRAM_ID, MetaMerkleLeaf, MetaMerkleProof};
use log::info;

use crate::{
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{generate_pdas_from_vote_proof_response, get_vote_account_proof},
        utils::{create_spinner, derive_proposal_index_pda, derive_proposal_pda, setup_all},
    },
};

pub async fn create_proposal(
    proposal_title: String,
    proposal_description: String,
    seed: Option<u64>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    snapshot_slot: u64,
    network: String,
    ballot_id: u64,
) -> Result<()> {
    log::debug!(
        "create_proposal: title={}, description={}, seed={:?}, identity_keypair={:?}, rpc_url={:?}",
        proposal_title,
        proposal_description,
        seed,
        identity_keypair,
        rpc_url
    );

    let (payer, vote_account, program, merkle_proof_program) =
        setup_all(identity_keypair, rpc_url).await?;

    let seed_value = seed.unwrap_or_else(rand::random::<u64>);

    let proposal_pda = derive_proposal_pda(seed_value, &vote_account, &program.id());

    let proposal_index_pda = derive_proposal_index_pda(&program.id());

    let proof_response =
        get_vote_account_proof(&vote_account.to_string(), snapshot_slot, &network).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(ballot_id, &proof_response)?;
    let voting_wallet = Pubkey::from_str(&proof_response.meta_merkle_leaf.voting_wallet)
        .map_err(|e| anyhow::anyhow!("Invalid voting wallet in proof: {}", e))?;
    if voting_wallet != payer.pubkey() {
        return Err(anyhow::anyhow!(
            "Voting wallet in proof ({}) doesn't match signer ({})",
            voting_wallet,
            payer.pubkey()
        ));
    }

    info!(
        "snapshot_program: {:?} consensus_result: {:?}, meta_merkle_proof: {:?}",
        SNAPSHOT_PROGRAM_ID.to_string(),
        consensus_result_pda.to_string(),
        meta_merkle_proof_pda.to_string(),
    );

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

    // First transaction: Initialize meta merkle proof if needed
    if meta_merkle_proof_account.is_none() {
        info!("Creating meta merkle proof account");

        let init_spinner = create_spinner("Initializing meta merkle proof...");

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

        let blockhash = merkle_proof_program.rpc().get_latest_blockhash().await?;
        let transaction = Transaction::new_signed_with_payer(
            &init_meta_merkle_proof_ix,
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        );

        let sig = merkle_proof_program
            .rpc()
            .send_and_confirm_transaction(&transaction)
            .await?;
        log::debug!(
            "Meta merkle proof initialization transaction sent successfully: signature={}",
            sig
        );

        init_spinner.finish_with_message(format!(
            "Meta merkle proof initialized. https://explorer.solana.com/tx/{}",
            sig
        ));
    }

    // Second transaction: Create proposal
    let spinner = create_spinner("Creating proposal...");

    let create_proposal_ixs = program
        .request()
        .args(args::CreateProposal {
            title: proposal_title,
            description: proposal_description,
            seed: seed_value,
        })
        .accounts(accounts::CreateProposal {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pda,
            proposal_index: proposal_index_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
            system_program: system_program::ID,
        })
        .instructions()?;

    let blockhash = program.rpc().get_latest_blockhash().await?;
    let transaction = Transaction::new_signed_with_payer(
        &create_proposal_ixs,
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );

    let sig = program
        .rpc()
        .send_and_confirm_transaction(&transaction)
        .await?;
    log::debug!(
        "Proposal creation transaction sent successfully: signature={}",
        sig
    );

    spinner.finish_with_message(format!(
        "Proposal {} created. https://explorer.solana.com/tx/{}",
        proposal_pda, sig
    ));

    Ok(())
}
