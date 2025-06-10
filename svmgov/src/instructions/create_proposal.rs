use std::sync::Arc;

use crate::{
    anchor_client_setup,
    govcontract::client::{accounts, args},
    load_identity_keypair,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::Result;
use log::info;

pub async fn create_proposal(
    proposal_title: String,
    proposal_description: String,
    seed: Option<u64>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    start_epoch: u64,
    length: u64
) -> Result<()> {
    let keypair = load_identity_keypair(identity_keypair)?;
    let payer = Arc::new(keypair);
    let payer_pubkey = payer.pubkey();

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, payer)?;

    // Generate or use provided seed
    let seed_value = seed.unwrap_or_else(|| rand::random::<u64>());

    let proposal_seeds = &[
        b"proposal",
        &seed_value.to_le_bytes(),
        payer_pubkey.as_ref(),
    ];
    let (proposal_pda, _bump) = Pubkey::find_program_address(proposal_seeds, &program.id());

    // Build and send the transaction
    let sig = program
        .request()
        .args(args::CreateProposal {
            title: proposal_title,
            description: proposal_description,
            start_epoch,
            voting_length_epochs: length,
            seed: seed_value,
        })
        .accounts(accounts::CreateProposal {
            signer: program.payer(),
            proposal: proposal_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    info!("Proposal {} created. https://explorer.solana.com/tx/{}", proposal_pda, sig);

    Ok(())
}
