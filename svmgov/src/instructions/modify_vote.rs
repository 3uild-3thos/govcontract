use std::str::FromStr;
use std::sync::Arc;

use crate::{
    anchor_client_setup,
    govcontract::client::{accounts, args},
    load_identity_keypair,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use log::info;

pub async fn modify_vote(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    // Validate that the total basis points sum to 10,000
    if for_votes + against_votes + abstain_votes != 10_000 {
        return Err(anyhow!("Total vote basis points must sum to 10,000"));
    }

    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    // Load the identity keypair
    let keypair = load_identity_keypair(identity_keypair)?;
    let payer = Arc::new(keypair);
    let payer_pubkey = payer.pubkey();

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, payer)?;

    // Derive the vote PDA using the seeds ["vote", proposal, signer]
    let vote_seeds = &[b"vote", proposal_pubkey.as_ref(), payer_pubkey.as_ref()];
    let (vote_pda, _bump) = Pubkey::find_program_address(vote_seeds, &program.id());

    // Build and send the transaction
    let sig = program
        .request()
        .args(args::ModifyVote {
            for_votes_bp: for_votes,
            against_votes_bp: against_votes,
            abstain_votes_bp: abstain_votes,
        })
        .accounts(accounts::ModifyVote {
            signer: payer_pubkey,
            proposal: proposal_pubkey,
            vote: vote_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    info!(
        "Vote modified successfully. https://explorer.solana.com/tx/{}",
        sig
    );
    Ok(())
}
