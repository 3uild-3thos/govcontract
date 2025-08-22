use std::str::FromStr;

use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use indicatif::{ProgressBar, ProgressStyle};

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    log::debug!(
        "support_proposal: proposal_id={}, identity_keypair={:?}, rpc_url={:?}",
        proposal_id,
        identity_keypair,
        rpc_url
    );

    let proposal_pubkey = match Pubkey::from_str(&proposal_id) {
        Ok(pubkey) => {
            log::debug!("Parsed proposal_pubkey: {}", pubkey);
            pubkey
        }
        Err(_) => {
            log::debug!("Invalid proposal_id: {}", proposal_id);
            return Err(anyhow!("Invalid proposal ID"));
        }
    };

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;
    log::debug!(
        "setup_all complete: payer_pubkey={}, vote_account={}",
        payer.pubkey(),
        vote_account
    );

    let support_seeds = &[b"support", proposal_pubkey.as_ref(), vote_account.as_ref()];
    let (support_pda, _bump) = Pubkey::find_program_address(support_seeds, &program.id());
    log::debug!("Derived support_pda: {}", support_pda);

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"]),
    );

    spinner.set_message("Supporting proposal...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    log::debug!("Building and sending SupportProposal transaction");
    let sig = program
        .request()
        .args(args::SupportProposal {})
        .accounts(accounts::SupportProposal {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pubkey,
            support: support_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    spinner.finish_with_message(format!(
        "Proposal supported. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
