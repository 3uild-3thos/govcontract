use std::{str::FromStr, sync::Arc};

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::signature::Keypair,
};

use anchor_lang::prelude::Pubkey;
use anyhow::{Result, anyhow};
use indicatif::{ProgressBar, ProgressStyle};
use serde_json::{json, Value};

use crate::{
    anchor_client_setup,
    govcontract::accounts::{Proposal, Vote},
};

pub async fn list_proposals(
    rpc_url: Option<String>,
    proposal_filter: Option<String>,
    limit: Option<usize>,
    json_output: bool,
) -> Result<()> {
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"])
    );

    spinner.set_message("Getting all proposals...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));
    let mut proposals = program.accounts::<Proposal>(vec![]).await?;

    // Stop the spinner 
    spinner.finish_with_message("Proposals collected.");

    if proposals.is_empty() {
        println!("No proposals found.");
        return Ok(());
    }

    if let Some(filter) = proposal_filter {
        if filter == "active" {
            proposals = proposals.into_iter().filter(|p| p.1.voting).collect();
        }
    }

    if let Some(lim) = limit {
        proposals.truncate(lim);
    }

    if json_output {
        let json_proposals: Vec<Value> = proposals.iter().map(|(pubkey, proposal)| {
            json!({
                "pubkey": pubkey.to_string(),
                "author": proposal.author.to_string(),
                "title": proposal.title,
                "description": proposal.description,
                "creation_epoch": proposal.creation_epoch,
                "start_epoch": proposal.start_epoch,
                "end_epoch": proposal.end_epoch,
                "proposer_stake_weight_bp": proposal.proposer_stake_weight_bp,
                "cluster_support_lamports": proposal.cluster_support_lamports,
                "for_votes_lamports": proposal.for_votes_lamports,
                "against_votes_lamports": proposal.against_votes_lamports,
                "abstain_votes_lamports": proposal.abstain_votes_lamports,
                "voting": proposal.voting,
                "finalized": proposal.finalized,
                "proposal_bump": proposal.proposal_bump,
                "creation_timestamp": proposal.creation_timestamp,
                "vote_count": proposal.vote_count,
                "index": proposal.index,
            })
        }).collect();
        let json_out = serde_json::to_string_pretty(&json_proposals)?;
        println!("{}", json_out);
    } else {
        for proposal in proposals {
            println!("\nProposal id: {}, \n{}", proposal.0, proposal.1);
        }
    }

    Ok(())
}

pub async fn list_votes(
    rpc_url: Option<String>,
    proposal_id: &String,
    verbose: bool,
    limit: Option<usize>,
    json_output: bool,
) -> Result<()> {
    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    // Rpc filter to get Vote accounts for this proposal
    let filter = vec![RpcFilterType::Memcmp(Memcmp::new(
        40,
        MemcmpEncodedBytes::Bytes(proposal_pubkey.to_bytes().to_vec()),
    ))];

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"])
    );

    spinner.set_message("Getting all vote accounts...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    let mut votes = program.accounts::<Vote>(filter).await?;

    // Stop the spinner 
    spinner.finish_with_message("Vote accounts collected.");

    if votes.is_empty() {
        println!("No votes found for proposal {}.", proposal_id);
        return Ok(());
    }

    if let Some(lim) = limit {
        votes.truncate(lim);
    }

    if json_output {
        let json_votes: Vec<Value> = votes.iter().map(|(pubkey, vote)| {
            json!({
                "pubkey": pubkey.to_string(),
                "validator": vote.validator.to_string(),
                "proposal": vote.proposal.to_string(),
                "for_votes_bp": vote.for_votes_bp,
                "against_votes_bp": vote.against_votes_bp,
                "abstain_votes_bp": vote.abstain_votes_bp,
                "vote_timestamp": vote.vote_timestamp,
                "bump": vote.bump,
            })
        }).collect();
        let json_out = serde_json::to_string_pretty(&json_votes)?;
        println!("{}", json_out);
    } else if verbose {
        for vote in votes {
            println!("Vote for proposal {}: \n{}", proposal_id, vote.1);
        }
    } else {
        for vote in votes {
            println!("Vote for proposal {}: {}", proposal_id, vote.0);
        }
    }

    Ok(())
}

pub async fn get_proposal(rpc_url: Option<String>, proposal_id: &String) -> Result<()> {
    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    let proposal_acc = program.account::<Proposal>(proposal_pubkey).await?;

    println!("Proposal id:  {} \n{}", proposal_id, proposal_acc);

    Ok(())
}