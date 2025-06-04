use std::{str::FromStr, sync::Arc};

use crate::{
    anchor_client_setup,
    govcontract::client::{accounts, args},
    load_identity_keypair,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use log::info;

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey =
        Pubkey::from_str(&proposal_id).map_err(|_| anyhow!("Invalid proposal ID"))?;
    // Load the signer's keypair
    let keypair = load_identity_keypair(identity_keypair)?;
    let payer = Arc::new(keypair);
    let payer_pubkey = payer.pubkey();

    // Create the Anchor client
    let program = anchor_client_setup(rpc_url, payer)?;

    // Derive the support PDA
    let support_seeds = &[b"support", proposal_pubkey.as_ref(), payer_pubkey.as_ref()];
    let (support_pda, _bump) = Pubkey::find_program_address(support_seeds, &program.id());

    // Build and send the transaction
    let sig = program
        .request()
        .args(args::SupportProposal {}) // No arguments are required
        .accounts(accounts::SupportProposal {
            signer: program.payer(),
            proposal: proposal_pubkey,
            support: support_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    info!("Proposal supported. https://explorer.solana.com/tx/{}", sig);

    Ok(())
}
