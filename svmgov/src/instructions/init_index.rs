use anchor_client::solana_sdk::{signer::Signer, system_program};
use anyhow::Result;

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{
        create_spinner, derive_proposal_index_pda, load_identity_keypair, program_setup_govcontract,
    },
};

pub async fn initialize_index(
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let identity_keypair = load_identity_keypair(identity_keypair)?;
    let program = program_setup_govcontract(identity_keypair.clone(), rpc_url.clone()).await?;

    let proposal_index = derive_proposal_index_pda();

    let spinner = create_spinner("Sending init_index transaction...");

    let sig = program
        .request()
        .args(args::InitializeIndex {})
        .accounts(accounts::InitializeIndex {
            signer: identity_keypair.pubkey(),
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
