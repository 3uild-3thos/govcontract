use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anyhow::{Result, anyhow};

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{create_spinner, setup_all},
};

pub async fn adjust_proposal_epochs(
    proposal_id: String,
    start_epoch: u64,
    end_epoch: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, _vote_account, program, _merkle_proof_program) =
        setup_all(identity_keypair, rpc_url).await?;

    let spinner = create_spinner("Adjusting proposal epochs...");

    let sig = program
        .request()
        .args(args::AdjustProposalEpochs {
            start_epoch,
            end_epoch,
        })
        .accounts(accounts::AdjustProposalEpochs {
            signer: payer.pubkey(),
            proposal: proposal_pubkey,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Proposal epochs adjusted successfully. Start epoch: {}, End epoch: {}. https://explorer.solana.com/tx/{}",
        start_epoch, end_epoch, sig
    ));

    Ok(())
}
