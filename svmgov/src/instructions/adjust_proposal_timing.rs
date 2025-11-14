use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anyhow::{anyhow, Result};

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{create_spinner, setup_all},
};

pub async fn adjust_proposal_timing(
    proposal_id: String,
    creation_timestamp: Option<i64>,
    creation_epoch: Option<u64>,
    start_epoch: Option<u64>,
    end_epoch: Option<u64>,
    snapshot_slot: Option<u64>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, _vote_account, program, _merkle_proof_program) = setup_all(identity_keypair, rpc_url).await?;

    let spinner = create_spinner("Adjusting proposal timing...");

    let sig = program
        .request()
        .args(args::AdjustProposalTiming {
            creation_timestamp,
            creation_epoch,
            start_epoch,
            end_epoch,
            snapshot_slot,
        })
        .accounts(accounts::AdjustProposalTiming {
            signer: payer.pubkey(),
            proposal: proposal_pubkey,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Proposal timing adjusted successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}

