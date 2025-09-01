use std::str::FromStr;

use crate::{
    create_spinner,
    govcontract::client::{accounts, args},
    setup_all,
    constants::*,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};

pub async fn cast_vote(
    proposal_id: String,
    votes_for: u64,
    votes_against: u64,
    abstain: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    // Debug: Log input parameters
    log::debug!(
        "cast_vote: proposal_id={}, votes_for={}, votes_against={}, abstain={}",
        proposal_id,
        votes_for,
        votes_against,
        abstain
    );

    // Validate that the total basis points sum to BASIS_POINTS_TOTAL (100%)
    if votes_for + votes_against + abstain != BASIS_POINTS_TOTAL {
        log::debug!(
            "Validation failed: votes_for={} + votes_against={} + abstain={} != {}",
            votes_for,
            votes_against,
            abstain,
            BASIS_POINTS_TOTAL
        );
        return Err(anyhow!("Total vote basis points must sum to {}", BASIS_POINTS_TOTAL));
    }
    log::debug!("Basis points validated: sum = {}", BASIS_POINTS_TOTAL);

    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    // Derive the vote PDA using the seeds ["vote", proposal, spl_vote_account]
    let vote_seeds = &[b"vote", proposal_pubkey.as_ref(), vote_account.as_ref()];
    let (vote_pda, bump) = Pubkey::find_program_address(vote_seeds, &program.id());
    log::debug!("Derived vote PDA: vote_pda={}, bump={}", vote_pda, bump);

    // Create a spinner for progress indication
    let spinner = create_spinner("Sending cast-vote transaction...");

    // Debug: Log before sending transaction
    log::debug!("Building and sending CastVote transaction");
    let sig = program
        .request()
        .args(args::CastVote {
            for_votes_bp: votes_for as u64,
            against_votes_bp: votes_against as u64,
            abstain_votes_bp: abstain as u64,
            meta_merkle_leaf: todo!("Implement meta merkle leaf"),
            meta_merkle_proof: vec![], // Empty proof for now
        })
        .accounts(accounts::CastVote {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pubkey,
            vote: vote_pda,
            consensus_result: Pubkey::new_unique(), // Mock consensus result
            snapshot_program: Pubkey::new_unique(), // Mock snapshot program
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    spinner.finish_with_message(format!(
        "Vote cast successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    log::debug!("cast_vote completed successfully");
    Ok(())
}
