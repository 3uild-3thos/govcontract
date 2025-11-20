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
    consensus_result: Option<Option<String>>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, _vote_account, program, _merkle_proof_program) = setup_all(identity_keypair, rpc_url).await?;

    // Parse consensus_result if provided
    // None = don't change, Some(None) = clear it, Some(Some(pubkey)) = set to pubkey
    let consensus_result_pubkey: Option<Option<Pubkey>> = if let Some(cr_opt) = consensus_result {
        if let Some(cr_str) = cr_opt {
            if cr_str.to_lowercase() == "none" || cr_str.is_empty() {
                Some(None) // Clear consensus_result
            } else {
                let pubkey = Pubkey::from_str(&cr_str)
                    .map_err(|_| anyhow!("Invalid consensus result pubkey: {}", cr_str))?;
                Some(Some(pubkey)) // Set to pubkey
            }
        } else {
            Some(None) // Clear consensus_result
        }
    } else {
        None // Don't change consensus_result
    };

    let spinner = create_spinner("Adjusting proposal timing...");

    let sig = program
        .request()
        .args(args::AdjustProposalTiming {
            creation_timestamp,
            creation_epoch,
            start_epoch,
            end_epoch,
            snapshot_slot,
            consensus_result: consensus_result_pubkey,
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

