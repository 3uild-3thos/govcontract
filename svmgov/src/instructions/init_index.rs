use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer, system_program};
use anyhow::Result;
use indicatif::{ProgressBar, ProgressStyle};

pub async fn initialize_index(
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    // Debug: Log before calling setup_all
    log::debug!(
        "Calling init_index with identity_keypair={:?}, rpc_url={:?}",
        identity_keypair,
        rpc_url
    );
    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;
    log::debug!(
        "setup_all complete: payer_pubkey={}, vote_account={}",
        payer.pubkey(),
        vote_account
    );

    // Derive the index PDA using the seed ["index"]
    let (proposal_index, _bump) = Pubkey::find_program_address(&[b"index"], &program.id());
    log::debug!(
        "Derived index PDA: index_pda={}, bump={}",
        proposal_index,
        _bump
    );

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"]),
    );

    spinner.set_message("Sending init_index transaction...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    // Debug: Log before sending transaction
    log::debug!("Building and sending InitializeIndex transaction");
    let sig = program
        .request()
        .args(args::InitializeIndex {})
        .accounts(accounts::InitializeIndex {
            signer: payer.pubkey(),
            proposal_index,
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    spinner.finish_with_message(format!(
        "Proposal index initialized successfully. https://explorer.solana.com/tx/{}",
        sig
    ));

    log::debug!("init_index completed successfully");
    Ok(())
}
