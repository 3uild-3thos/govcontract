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
        info!("Proposal: {:#?}", proposal.1);
    }

    Ok(())
}

pub async fn list_votes(rpc_url: Option<String>, proposal_id: &String) -> Result<()> {
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

    let votes = program.accounts::<Vote>(filter).await?;

    for vote in votes {
        info!("Vote for proposal {}: {:#?}", proposal_id, vote.1);
    }

    Ok(())
}
