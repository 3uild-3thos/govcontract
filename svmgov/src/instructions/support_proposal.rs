use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

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

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    let proof_response =
        get_vote_account_proof(&vote_account.to_string(), snapshot_slot, &network).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(ballot_id, &proof_response)?;

    let support_pda = derive_support_pda(&proposal_pubkey, &vote_account, &program.id());

    let spinner = create_spinner("Supporting proposal...");

    let sig = program
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
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Proposal supported. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
