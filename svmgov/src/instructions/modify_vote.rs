use std::str::FromStr;
use log::debug;

use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};

pub async fn modify_vote(
    proposal_id: String,
    for_votes: u64,
    against_votes: u64,
    abstain_votes: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    debug!("modify_vote called with proposal_id: {}, for_votes: {}, against_votes: {}, abstain_votes: {}, identity_keypair: {:?}, rpc_url: {:?}", proposal_id, for_votes, against_votes, abstain_votes, identity_keypair, rpc_url);

    // Validate that the total basis points sum to 10,000
    if for_votes + against_votes + abstain_votes != 10_000 {
        return Err(anyhow!("Total vote basis points must sum to 10,000: got {}", for_votes + against_votes + abstain_votes));
    }

    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = match Pubkey::from_str(&proposal_id) {
        Ok(pubkey) => pubkey,
        Err(_) => {
            return Err(anyhow!("Invalid proposal ID: {}", proposal_id));
        }
    };

    // Load identity keypair, set up cluster and rpc_client, find native vote account
    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;
    debug!("Setup complete: payer={}, vote_account={}", payer.pubkey(), vote_account);

    let payer_pubkey = payer.pubkey();
    // Derive the vote PDA using the seeds ["vote", proposal, signer]
    let vote_seeds = &[b"vote", proposal_pubkey.as_ref(), payer_pubkey.as_ref()];
    let (vote_pda, _bump) = Pubkey::find_program_address(vote_seeds, &program.id());
    debug!("Derived vote PDA: {}", vote_pda);

    // Build and send the transaction
    debug!("Sending modify_vote transaction");
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
            system_program: system_program::ID,
        })
        .send()
        .await?;

    println!(
        "Vote modified successfully. https://explorer.solana.com/tx/{}",
        sig
    );
    Ok(())
}