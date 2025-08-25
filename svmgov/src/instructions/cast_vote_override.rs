use std::str::FromStr;

use crate::{
    fetch_snapshot_data,
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use indicatif::{ProgressBar, ProgressStyle};

pub async fn cast_vote_override(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    operator_api: Option<String>,
) -> Result<()> {
    // Debug: Log input parameters
    log::debug!(
        "cast_vote_override: proposal_id={}, for_votes={}, against_votes={}, abstain_votes={}, operator_api={:?}",
        proposal_id,
        for_votes,
        against_votes,
        abstain_votes,
        operator_api
    );

    // Validate that the total basis points sum to 10,000 (100%)
    if for_votes + against_votes + abstain_votes != 10_000 {
        log::debug!(
            "Validation failed: for_votes={} + against_votes={} + abstain_votes={} != 10,000",
            for_votes,
            against_votes,
            abstain_votes
        );
        return Err(anyhow!("Total vote basis points must sum to 10,000"));
    }
    log::debug!("Basis points validated: sum = 10,000");

    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = match Pubkey::from_str(&proposal_id) {
        Ok(pubkey) => {
            log::debug!("Parsed proposal_id into Pubkey: {}", pubkey);
            pubkey
        }
        Err(_) => {
            log::debug!("Failed to parse proposal_id: {}", proposal_id);
            return Err(anyhow!("Invalid proposal ID: {}", proposal_id));
        }
    };

    // Debug: Log before calling setup_all
    log::debug!(
        "Calling setup_all with identity_keypair={:?}, rpc_url={:?}",
        identity_keypair,
        rpc_url
    );
    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;
    let payer_pubkey = payer.pubkey();
    log::debug!(
        "setup_all complete: payer_pubkey={}, vote_account={}",
        payer_pubkey,
        vote_account
    );

    // Fetch snapshot data from operator API
    let snapshot_data =
        fetch_snapshot_data(&payer.pubkey(), &proposal_pubkey, operator_api).await?;
    println!("📸 Snapshot data retrieved successfully");

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"]),
    );

    spinner.set_message("Sending vote override transaction...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    // Debug: Log before sending transaction
    log::debug!("Building and sending CastVoteOverride transaction");

    // TODO: Uncomment when the contract types are available
    
    let sig = program
        .request()
        .args(args::CastVoteOverride {
            for_votes_bp: for_votes,
            against_votes_bp: against_votes,
            abstain_votes_bp: abstain_votes,
            proof: snapshot_data.merkle_proof,
        })
        .accounts(accounts::CastVoteOverride {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            spl_stake_account: snapshot_data.stake_account,
            proposal: proposal_pubkey,
            validator_vote: snapshot_data.validator_vote_pda,
            vote_override: snapshot_data.vote_override_pda,
            snapshot_program: snapshot_data.snapshot_program,
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);
    

    // For now, just show what would be sent
    log::debug!("Vote override data prepared:");
    log::debug!("  - Proposal: {}", proposal_pubkey);
    log::debug!("  - For votes: {} bp", for_votes);
    log::debug!("  - Against votes: {} bp", against_votes);
    log::debug!("  - Abstain votes: {} bp", abstain_votes);
    log::debug!("  - Snapshot data retrieved successfully");

    spinner.finish_with_message(format!(
        "Vote override prepared for proposal {}. Ready for contract integration.",
        proposal_pubkey
    ));

    log::debug!("cast_vote_override completed successfully");
    Ok(())
}
