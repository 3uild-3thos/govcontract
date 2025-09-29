use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anyhow::{Result, anyhow};

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{create_spinner, load_identity_keypair, program_setup_govcontract},
};

pub async fn finalize_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let identity_keypair = load_identity_keypair(identity_keypair)?;
    let program = program_setup_govcontract(identity_keypair.clone(), rpc_url.clone()).await?;

    let spinner = create_spinner("Finalizing proposal...");

    let sig = program
        .request()
        .args(args::FinalizeProposal {})
        .accounts(accounts::FinalizeProposal {
            signer: identity_keypair.pubkey(),
            proposal: proposal_pubkey,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Proposal finalized successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
