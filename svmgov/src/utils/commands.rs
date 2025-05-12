use std::{str::FromStr, sync::Arc};

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::signature::Keypair,
};

use anchor_lang::prelude::Pubkey;
use anyhow::{Result, anyhow};
use log::info;

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

    // Rpc filter to get Proposal accounts
    let filter = if let Some(proposal_filter) = proposal_filter {
        if proposal_filter == "active" {
            vec![RpcFilterType::Memcmp(Memcmp::new(
                412,
                MemcmpEncodedBytes::Bytes(vec![1u8]),
            ))]
        } else {
            vec![]
        }
    } else {
        vec![]
    };

    let proposals = program.accounts::<Proposal>(filter).await?;

    for proposal in proposals {
        info!("Proposal: {:#?}", proposal.1);
    }

    Ok(())
}

pub async fn list_votes(
    rpc_url: Option<String>,
    proposal_filter: Option<String>,
    proposal_id: &String,
) -> Result<()> {
    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;
    // Create a mock Payer
    let mock_payer = Arc::new(Keypair::new());

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, mock_payer)?;

    // Rpc filter to get Vote accounts
    let filter = if let Some(proposal_filter) = proposal_filter {
        if proposal_filter == "active" {
            vec![RpcFilterType::Memcmp(Memcmp::new(
                412,
                MemcmpEncodedBytes::Bytes(vec![1u8]),
            ))]
        } else {
            vec![]
        }
    } else {
        vec![RpcFilterType::Memcmp(Memcmp::new(
            8,
            MemcmpEncodedBytes::Bytes(proposal_pubkey.to_bytes().to_vec()),
        ))]
    };

    let votes = program.accounts::<Vote>(filter).await?;

    for vote in votes {
        info!("Votes for proposal: {:#?}", vote.1);
    }

    Ok(())
}
