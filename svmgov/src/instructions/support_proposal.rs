use std::{str::FromStr, sync::Arc};

use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use log::info;

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    validator: Pubkey,
) -> Result<()> {
    let proposal_pubkey =
        Pubkey::from_str(&proposal_id).map_err(|_| anyhow!("Invalid proposal ID"))?;

    // Load identity keypair, set up cluster and rpc_client, find native vote accunt
    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url, validator).await?;

    // Derive the support PDA
    let support_seeds = &[b"support", proposal_pubkey.as_ref(), validator.as_ref()];
    let (support_pda, _bump) = Pubkey::find_program_address(support_seeds, &program.id());

    // Build and send the transaction
    let sig = program
        .request()
        .args(args::SupportProposal {}) // No arguments are required
        .accounts(accounts::SupportProposal {
            signer: payer.pubkey(),
            validator,
            vote_account,
            proposal: proposal_pubkey,
            support: support_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    info!("Proposal supported. https://explorer.solana.com/tx/{}", sig);

    Ok(())
}
