use std::{str::FromStr, sync::Arc};

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::signature::Keypair,
};

use anchor_lang::prelude::Pubkey;
use anyhow::{Result, anyhow};
use comfy_table::modifiers::UTF8_ROUND_CORNERS;
use comfy_table::{Cell, Table, presets::UTF8_FULL};
use log::info;
use serde_json::{Value, json};

use crate::{
    anchor_client_setup, create_spinner,
    govcontract::accounts::{Proposal, Vote},
};

/// Detect terminal width using various methods
fn detect_terminal_width() -> Option<u16> {
    // Method 1: Check COLUMNS environment variable
    if let Ok(cols) = std::env::var("COLUMNS") {
        if let Ok(width) = cols.parse::<u16>() {
            return Some(width);
        }
    }

    // Method 2: Try tput command (Unix-like systems)
    #[cfg(unix)]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("tput").arg("cols").output() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                if let Ok(width) = s.trim().parse::<u16>() {
                    return Some(width);
                }
            }
        }
    }

    // Method 3: Try stty command (Unix-like systems)
    #[cfg(unix)]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("stty").arg("size").output() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                let parts: Vec<&str> = s.trim().split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(width) = parts[1].parse::<u16>() {
                        return Some(width);
                    }
                }
            }
        }
    }

    None
}

pub async fn list_votes(
    rpc_url: Option<String>,
    proposal_id: &String,
    verbose: bool,
    limit: Option<usize>,
    json_output: bool,
) -> Result<()> {
    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(proposal_id)
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
    let spinner = create_spinner("Getting all vote accounts...");

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
        let json_votes: Vec<Value> = votes
            .iter()
            .map(|(pubkey, vote)| {
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
            })
            .collect();
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
    let proposal_pubkey = Pubkey::from_str(proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    let proposal_acc = program.account::<Proposal>(proposal_pubkey).await?;

    print_proposal_detail(proposal_id, &proposal_acc);

    Ok(())
}

fn print_proposal_detail(proposal_id: &str, proposal: &Proposal) {
    let mut table = Table::new();
    table
        .load_preset(UTF8_FULL)
        .apply_modifier(UTF8_ROUND_CORNERS)
        .set_content_arrangement(comfy_table::ContentArrangement::Dynamic);

    // Set table width based on terminal size
    // Try multiple methods to detect terminal width
    let terminal_width = detect_terminal_width().unwrap_or(120);
    table.set_width(terminal_width);

    table.set_header(vec!["Field", "Value"]);

    // With ContentArrangement::Dynamic, comfy-table automatically handles column widths
    // and wraps long text in the Value column appropriately

    let for_sol = proposal.for_votes_lamports as f64 / 1_000_000_000.0;
    let against_sol = proposal.against_votes_lamports as f64 / 1_000_000_000.0;
    let abstain_sol = proposal.abstain_votes_lamports as f64 / 1_000_000_000.0;
    let cluster_support_sol = proposal.cluster_support_lamports as f64 / 1_000_000_000.0;
    let proposer_stake_bp = proposal.proposer_stake_weight_bp as f64 / 100.0;

    let status = if proposal.finalized {
        "Finalized"
    } else if proposal.voting {
        "Voting"
    } else {
        "Support Period"
    };

    table.add_row(vec![Cell::new("Proposal ID"), Cell::new(proposal_id)]);
    table.add_row(vec![Cell::new("Title"), Cell::new(&proposal.title)]);
    table.add_row(vec![
        Cell::new("Description"),
        Cell::new(&proposal.description),
    ]);
    table.add_row(vec![
        Cell::new("Author"),
        Cell::new(proposal.author.to_string()),
    ]);
    table.add_row(vec![Cell::new("Status"), Cell::new(status)]);
    table.add_row(vec![
        Cell::new("Index"),
        Cell::new(proposal.index.to_string()),
    ]);
    table.add_row(vec![
        Cell::new("Creation Epoch"),
        Cell::new(proposal.creation_epoch.to_string()),
    ]);
    table.add_row(vec![
        Cell::new("Start Epoch"),
        Cell::new(proposal.start_epoch.to_string()),
    ]);
    table.add_row(vec![
        Cell::new("End Epoch"),
        Cell::new(proposal.end_epoch.to_string()),
    ]);
    table.add_row(vec![
        Cell::new("Snapshot Slot"),
        Cell::new(proposal.snapshot_slot.to_string()),
    ]);
    table.add_row(vec![
        Cell::new("Proposer Stake Weight"),
        Cell::new(format!("{:.2}%", proposer_stake_bp)),
    ]);
    table.add_row(vec![
        Cell::new("Cluster Support"),
        Cell::new(format!("{:.2} SOL", cluster_support_sol)),
    ]);
    table.add_row(vec![
        Cell::new("Vote Count"),
        Cell::new(proposal.vote_count.to_string()),
    ]);
    table.add_row(vec![
        Cell::new("For Votes"),
        Cell::new(format!(
            "{} lamports ({:.2} SOL)",
            proposal.for_votes_lamports, for_sol
        )),
    ]);
    table.add_row(vec![
        Cell::new("Against Votes"),
        Cell::new(format!(
            "{} lamports ({:.2} SOL)",
            proposal.against_votes_lamports, against_sol
        )),
    ]);
    table.add_row(vec![
        Cell::new("Abstain Votes"),
        Cell::new(format!(
            "{} lamports ({:.2} SOL)",
            proposal.abstain_votes_lamports, abstain_sol
        )),
    ]);
    if let Some(consensus_result) = proposal.consensus_result {
        table.add_row(vec![
            Cell::new("Consensus Result"),
            Cell::new(consensus_result.to_string()),
        ]);
    }
    table.add_row(vec![
        Cell::new("Creation Timestamp"),
        Cell::new(proposal.creation_timestamp.to_string()),
    ]);

    println!("\n{}", table);
}
