use std::str::FromStr;
use std::sync::Arc;

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::pubkey::Pubkey,
};
use anchor_lang::prelude::AccountMeta;
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use log::info;

use crate::{
    anchor_client_setup,
    govcontract::{
        accounts::{Proposal, Vote},
        client::{accounts, args},
    },
    load_identity_keypair,
};
pub async fn tally_votes(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    // Load the identity keypair
    let keypair = load_identity_keypair(identity_keypair)?;
    let payer = Arc::new(keypair);

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, payer)?;

    // Rpc filter to get Vote accounts for this proposal
    let filter = RpcFilterType::Memcmp(Memcmp::new(
        8,
        MemcmpEncodedBytes::Bytes(proposal_pubkey.to_bytes().to_vec()),
    ));

    let vote_accounts = program.accounts::<Vote>(vec![filter]).await?;

    let mut batches = vote_accounts.len() / 10;

    if (vote_accounts.len() % 10) > 0 {
        batches += 1;
    }
    let mut finalize = false;

    // Tally the votes, 10 at a time
    for (index, votes_chunk) in vote_accounts.chunks(10).enumerate() {
        if index == (batches - 1) {
            finalize = true
        }
        let mut votes = vec![];
        for vote in votes_chunk {
            votes.push(AccountMeta {
                pubkey: vote.0,
                is_signer: false,
                is_writable: true,
            });
        }

        let sig = program
            .request()
            .args(args::TallyVotes { finalize })
            .accounts(accounts::TallyVotes {
                signer: program.payer(),
                proposal: proposal_pubkey,
                system_program: system_program::ID,
            })
            // Remaining accounts
            .accounts(votes)
            .send()
            .await?;

        info!("Tally votes: https://explorer.solana.com/tx/{}", sig);
    }
    let proposal = program.account::<Proposal>(proposal_pubkey).await?;

    info!("Tally finished: {:#?}", proposal);

    Ok(())
}
