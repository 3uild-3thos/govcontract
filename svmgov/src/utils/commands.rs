use std::{str::FromStr, sync::Arc};

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::signature::Keypair,
};

use anchor_lang::prelude::Pubkey;
use anyhow::{Result, anyhow};
use serde_json::{Value, json};

use crate::{
    create_spinner,
    govcontract::accounts::{Proposal, Vote},
    utils::utils::program_setup_govcontract,
};

/// Validate that a string can be parsed as a valid Solana pubkey
pub fn validate_pubkey_input(input: &str) -> Result<Pubkey> {
    Pubkey::from_str(input).map_err(|_| {
        anyhow!(
            "Invalid pubkey format: '{}'. Expected a base58-encoded Solana public key.",
            input
        )
    })
}

/// Validate proposal filter parameter
pub fn validate_proposal_filter(filter: &str) -> Result<()> {
    match filter {
        "active" => Ok(()),
        _ => Err(anyhow!(
            "Invalid filter '{}'. Supported filters: 'active'",
            filter
        )),
    }
}

/// Validate limit parameter (must be positive)
pub fn validate_limit(limit: usize) -> Result<()> {
    if limit == 0 {
        Err(anyhow!("Limit must be greater than 0"))
    } else if limit > 1000 {
        Err(anyhow!("Limit cannot exceed 1000"))
    } else {
        Ok(())
    }
}

/// Validate that a proposal ID exists and is accessible
pub async fn validate_proposal_exists(
    proposal_id: &str,
    rpc_url: Option<String>,
) -> Result<Proposal> {
    let proposal_pubkey = validate_pubkey_input(proposal_id)?;

    let mock_payer = Arc::new(Keypair::new());
    let program = program_setup_govcontract(mock_payer, rpc_url)
        .await
        .map_err(|e| anyhow!("Failed to connect to Solana network: {}", e))?;

    program
        .account::<Proposal>(proposal_pubkey)
        .await
        .map_err(|_| anyhow!("Proposal '{}' not found or not accessible", proposal_id))
}

pub async fn list_proposals(
    rpc_url: Option<String>,
    proposal_filter: Option<String>,
    limit: Option<usize>,
    json_output: bool,
) -> Result<()> {
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = program_setup_govcontract(mock_payer, rpc_url)
        .await
        .map_err(|e| anyhow!("Failed to connect to Solana network: {}", e))?;

    // Create a spinner for progress indication
    let spinner = create_spinner("Getting all proposals...");
    let mut proposals = program.accounts::<Proposal>(vec![]).await?;

    // Stop the spinner
    spinner.finish_with_message("Proposals collected.");

    if proposals.is_empty() {
        println!("No proposals found.");
        return Ok(());
    }

    if let Some(filter) = proposal_filter {
        if filter == "active" {
            proposals.retain(|p| p.1.voting);
        }
    }

    if let Some(lim) = limit {
        proposals.truncate(lim);
    }

    if json_output {
        let json_proposals: Vec<Value> = proposals
            .iter()
            .map(|(pubkey, proposal)| {
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
            })
            .collect();
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
    // Validate the proposal ID
    let proposal_pubkey = validate_pubkey_input(proposal_id).map_err(|e| anyhow!(e))?;

    // Validate limit if provided
    if let Some(lim) = limit {
        validate_limit(lim).map_err(|e| anyhow!(e))?;
    }
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = program_setup_govcontract(mock_payer, rpc_url)
        .await
        .map_err(|e| anyhow!("Failed to connect to Solana network: {}", e))?;

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
    // Validate the proposal ID and get the proposal data
    let proposal = validate_proposal_exists(proposal_id, rpc_url)
        .await
        .map_err(|e| anyhow!(e))?;

    println!("Proposal id:  {} \n{}", proposal_id, proposal);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_pubkey_input_valid() {
        // Test with a valid pubkey
        let valid_pubkey = "11111111111111111111111111111112";
        let result = validate_pubkey_input(valid_pubkey);
        assert!(result.is_ok(), "Valid pubkey should be accepted");

        let pubkey = result.unwrap();
        assert_eq!(pubkey.to_string(), valid_pubkey);
    }

    #[test]
    fn test_validate_pubkey_input_invalid_empty() {
        let result = validate_pubkey_input("");
        assert!(result.is_err(), "Empty string should be rejected");
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Invalid pubkey format")
        );
    }

    #[test]
    fn test_validate_pubkey_input_invalid_too_short() {
        let result = validate_pubkey_input("1111111111111111111111111111111"); // 31 chars
        assert!(result.is_err(), "Too short pubkey should be rejected");
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Invalid pubkey format")
        );
    }

    #[test]
    fn test_validate_pubkey_input_invalid_too_long() {
        let result = validate_pubkey_input(
            "111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
        ); // way too long
        assert!(result.is_err(), "Too long pubkey should be rejected");
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Invalid pubkey format")
        );
    }

    #[test]
    fn test_validate_pubkey_input_invalid_characters() {
        let result = validate_pubkey_input("zzzz111111111111111111111111111111"); // invalid base58
        assert!(
            result.is_err(),
            "Invalid base58 characters should be rejected"
        );
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Invalid pubkey format")
        );
    }

    #[test]
    fn test_validate_proposal_filter_valid() {
        let result = validate_proposal_filter("active");
        assert!(result.is_ok(), "Valid filter should be accepted");
    }

    #[test]
    fn test_validate_proposal_filter_invalid() {
        let result = validate_proposal_filter("invalid");
        assert!(result.is_err(), "Invalid filter should be rejected");

        let error_msg = result.unwrap_err();
        assert!(error_msg.to_string().contains("Invalid filter"));
        assert!(error_msg.to_string().contains("active"));
    }

    #[test]
    fn test_validate_proposal_filter_case_sensitive() {
        let result = validate_proposal_filter("Active");
        assert!(
            result.is_err(),
            "Case-sensitive filter should reject uppercase"
        );
    }

    #[test]
    fn test_validate_limit_valid() {
        assert!(validate_limit(1).is_ok(), "Limit of 1 should be valid");
        assert!(validate_limit(100).is_ok(), "Limit of 100 should be valid");
        assert!(
            validate_limit(1000).is_ok(),
            "Limit of 1000 should be valid"
        );
    }

    #[test]
    fn test_validate_limit_zero() {
        let result = validate_limit(0);
        assert!(result.is_err(), "Zero limit should be rejected");
        assert!(result.unwrap_err().to_string().contains("greater than 0"));
    }

    #[test]
    fn test_validate_limit_too_large() {
        let result = validate_limit(1001);
        assert!(result.is_err(), "Limit > 1000 should be rejected");
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("cannot exceed 1000")
        );
    }

    #[test]
    fn test_validate_limit_boundary_values() {
        // Test edge cases
        assert!(validate_limit(999).is_ok(), "Limit of 999 should be valid");
        assert!(
            validate_limit(1001).is_err(),
            "Limit of 1001 should be invalid"
        );
    }
}
