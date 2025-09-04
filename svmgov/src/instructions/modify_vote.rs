use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{anyhow, Result};
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

use crate::{
    constants::*,
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{generate_pdas_from_vote_proof_response, get_vote_account_proof},
        utils::{
            create_spinner,
            derive_vote_pda,
            setup_all,
        },
    },
};

pub async fn modify_vote(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    if for_votes + against_votes + abstain_votes != BASIS_POINTS_TOTAL {
        return Err(anyhow!("Total vote basis points must sum to {}", BASIS_POINTS_TOTAL));
    }

    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    let proof_response = get_vote_account_proof(&vote_account.to_string(), None).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(&proof_response)?;

    let vote_pda = derive_vote_pda(&proposal_pubkey, &vote_account, &program.id());

    let spinner = create_spinner("Modifying vote...");

    let sig = program
        .request()
        .args(args::ModifyVote {
            for_votes_bp: for_votes,
            against_votes_bp: against_votes,
            abstain_votes_bp: abstain_votes,
        })
        .accounts(accounts::ModifyVote {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pubkey,
            vote: vote_pda,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Vote modified successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
