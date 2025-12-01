use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anyhow::{anyhow, Result};

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{create_spinner, setup_all},
};

pub async fn adjust_creation_epoch(
    proposal_id: String,
    new_creation_epoch: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, _vote_account, program, _merkle_proof_program) = setup_all(identity_keypair, rpc_url).await?;

    let spinner = create_spinner("Adjusting creation epoch...");

    let sig = program
        .request()
        .args(args::AdjustCreationEpoch {
            new_creation_epoch,
        })
        .accounts(accounts::AdjustCreationEpoch {
            signer: payer.pubkey(),
            proposal: proposal_pubkey,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Creation epoch adjusted successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}


