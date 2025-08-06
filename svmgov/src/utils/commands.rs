use std::{str::FromStr, sync::Arc};

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::signature::Keypair,
};

use anchor_lang::prelude::Pubkey;
use anyhow::{Result, anyhow};

use crate::{
    anchor_client_setup,
    govcontract::accounts::{Proposal, Vote},
};

pub async fn list_proposals(
    rpc_url: Option<String>,
    proposal_filter: Option<String>,
) -> Result<()> {
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    let proposals = program.accounts::<Proposal>(vec![]).await?;

    let filtered_proposals = if let Some(filter) = proposal_filter {
        if filter == "active" {
            proposals.into_iter().filter(|p| p.1.voting).collect()
        } else {
            proposals
        }
    } else {
        proposals
    };

    for proposal in filtered_proposals {
        println!("\nProposal id: {}, \n{}", proposal.0, proposal.1);
    }

    Ok(())
}

pub async fn list_votes(
    rpc_url: Option<String>,
    proposal_id: &str,
    verbose: bool,
    voter_pubkey: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let mock_payer = Arc::new(Keypair::new());
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    let mut filters = vec![RpcFilterType::Memcmp(Memcmp::new(
        40,
        MemcmpEncodedBytes::Bytes(proposal_pubkey.to_bytes().to_vec()),
    ))];

    if let Some(voter_key) = voter_pubkey {
        let voter_pubkey = Pubkey::from_str(&voter_key)
            .map_err(|_| anyhow!("Invalid voter pubkey: {}", voter_key))?;
        filters.push(RpcFilterType::Memcmp(Memcmp::new(
            8,
            MemcmpEncodedBytes::Bytes(voter_pubkey.to_bytes().to_vec()),
        )));
    }

    let votes = program.accounts::<Vote>(filters).await?;

    if verbose {
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
