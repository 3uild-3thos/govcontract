use std::str::FromStr;

use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use indicatif::{ProgressBar, ProgressStyle};

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

    // Validate that the total basis points sum to 10,000 (100%)
    if votes_for + votes_against + abstain != 10_000 {
        log::debug!(
            "Validation failed: votes_for={} + votes_against={} + abstain={} != 10,000",
            votes_for,
            votes_against,
            abstain
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

    // Derive the vote PDA using the seeds ["vote", proposal, signer]
    let vote_seeds = &[b"vote", proposal_pubkey.as_ref(), payer_pubkey.as_ref()];
    let (vote_pda, bump) = Pubkey::find_program_address(vote_seeds, &program.id());
    log::debug!("Derived vote PDA: vote_pda={}, bump={}", vote_pda, bump);

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"])
    );

    spinner.set_message("Sending cast-vote transaction...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));
    // Debug: Log before sending transaction
    log::debug!("Building and sending CastVote transaction");
    let sig = program
        .request()
        .args(args::CastVote {
            for_votes_bp: votes_for as u64,
            against_votes_bp: votes_against as u64,
            abstain_votes_bp: abstain as u64,
        })
        .accounts(accounts::CastVote {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pubkey,
            vote: vote_pda,
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
