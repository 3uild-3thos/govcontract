use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{anyhow, Result};
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

use crate::{
    constants::*,
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{
            convert_merkle_proof_strings, convert_stake_merkle_leaf_data_to_idl_type,
            generate_pdas_from_vote_proof_response, get_stake_account_proof,
            get_vote_account_proof, get_voter_summary,
        },
        utils::{create_spinner, derive_vote_override_pda, derive_vote_pda, setup_all},
    },
};

pub async fn cast_vote_override(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    _operator_api: Option<String>,
) -> Result<()> {
    if for_votes + against_votes + abstain_votes != BASIS_POINTS_TOTAL {
        return Err(anyhow!(
            "Total vote basis points must sum to {}",
            BASIS_POINTS_TOTAL
        ));
    }

    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    let voter_summary = get_voter_summary(&payer.pubkey(), None).await?;
    let stake_account = voter_summary
        .stake_accounts
        .first()
        .ok_or(anyhow!("No stake account found for voter"))?;

    let meta_merkle_proof = get_vote_account_proof(&vote_account.to_string(), None).await?;
    let stake_merkle_proof = get_stake_account_proof(&stake_account.stake_account, None).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(&meta_merkle_proof)?;

    let validator_vote_pda = derive_vote_pda(&proposal_pubkey, &vote_account, &program.id());
    let vote_override_pda = derive_vote_override_pda(
        &proposal_pubkey,
        &Pubkey::from_str(&stake_account.stake_account)?,
        &validator_vote_pda,
        &program.id(),
    );

    let stake_merkle_proof_vec =
        convert_merkle_proof_strings(&stake_merkle_proof.stake_merkle_proof)?;

    let stake_merkle_leaf =
        convert_stake_merkle_leaf_data_to_idl_type(&stake_merkle_proof.stake_merkle_leaf)?;

    let spinner = create_spinner("Sending vote override transaction...");

    let sig = program
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
            spl_vote_account: vote_account,
            spl_stake_account: Pubkey::from_str(&stake_account.stake_account)?,
            proposal: proposal_pubkey,
            validator_vote: validator_vote_pda,
            vote_override: vote_override_pda,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Vote override cast successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
