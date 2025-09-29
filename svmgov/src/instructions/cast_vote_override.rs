use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

use crate::{
    constants::*,
    gov_v1,
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{
            convert_merkle_proof_strings, get_stake_account_proof, get_vote_account_proof,
            get_voter_summary,
        },
        utils::{
            create_spinner, derive_vote_override_pda, derive_vote_pda,
            ensure_meta_merkle_proof_initialized, load_identity_keypair, program_setup_govcontract,
        },
    },
};

pub async fn cast_vote_override(
    proposal_id: String,
    votes_for: u64,
    votes_against: u64,
    votes_abstain: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    spl_vote_account: Option<String>,
    spl_stake_account: Option<String>,
) -> Result<()> {
    if votes_for + votes_against + votes_abstain != BASIS_POINTS_TOTAL {
        return Err(anyhow!(
            "Total vote basis points must sum to {}",
            BASIS_POINTS_TOTAL
        ));
    }

    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let identity_keypair = load_identity_keypair(identity_keypair)?;
    let program = program_setup_govcontract(identity_keypair.clone(), rpc_url.clone()).await?;
    let voter_summary = get_voter_summary(&identity_keypair.pubkey().to_string(), None).await?;
    let spl_stake_account: Pubkey = if let Some(stake_account) = spl_stake_account {
        Pubkey::from_str(&stake_account).map_err(|_| anyhow!("Invalid stake account: {}", stake_account))?
    } else {
        (&voter_summary.stake_accounts[0]).try_into()?
    };
    let delegator_vote_proof = get_stake_account_proof(&spl_stake_account, None).await?;
    let stake_merkle_proof = convert_merkle_proof_strings(&delegator_vote_proof.stake_merkle_proof)?;
    let stake_merkle_leaf = (&delegator_vote_proof.stake_merkle_leaf).try_into()?;
    let spl_vote_account = if let Some(spl_vote_account) = spl_vote_account {
        Pubkey::from_str(&spl_vote_account).map_err(|_| anyhow!("Invalid vote account: {}", spl_vote_account))?
    } else {
        Pubkey::from_str(&voter_summary.stake_accounts[0].vote_account).map_err(|_| anyhow!("Invalid vote account: {}", voter_summary.stake_accounts[0].vote_account))?
    };
    let validator_vote_proof =
        get_vote_account_proof(&spl_vote_account, None).await?;

    let validator_vote_pda = derive_vote_pda(&proposal_pubkey, &spl_vote_account);
    let vote_override_pda = derive_vote_override_pda(&proposal_pubkey, &spl_stake_account, &validator_vote_pda);

    // Ensure MetaMerkleProof PDA is initialized
    let (consensus_result_pda, meta_merkle_proof_pda) = ensure_meta_merkle_proof_initialized(
        &proposal_id,
        &validator_vote_proof,
        0i64,
        identity_keypair.clone(),
        rpc_url.clone(),
    )
    .await?;

    let spinner = create_spinner("Sending vote override transaction...");

    let sig = program
        .request()
        .args(args::CastVoteOverride {
            spl_vote_account,
            spl_stake_account,
            for_votes_bp: votes_for,
            against_votes_bp: votes_against,
            abstain_votes_bp: votes_abstain,
            stake_merkle_proof,
            stake_merkle_leaf,
        })
        .accounts(accounts::CastVoteOverride {
            signer: identity_keypair.pubkey(),
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
