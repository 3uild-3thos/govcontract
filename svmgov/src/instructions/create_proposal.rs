use anchor_client::solana_sdk::signer::Signer;
use anchor_lang::system_program;
use anyhow::Result;

use crate::{
    govcontract::client::{accounts, args},
    utils::{
        utils::{
            create_spinner, derive_proposal_index_pda, derive_proposal_pda, load_identity_keypair,
            program_setup_govcontract, find_spl_vote_account,
        },
    },
};

pub async fn create_proposal(
    proposal_title: String,
    proposal_description: String,
    seed: Option<u64>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    start_epoch: u64,
    length: u64,
) -> Result<()> {
    log::debug!(
        "create_proposal: title={}, description={}, seed={:?}, identity_keypair={:?}, rpc_url={:?}, start_epoch={}, length={}",
        proposal_title,
        proposal_description,
        seed,
        identity_keypair,
        rpc_url,
        start_epoch,
        length
    );

    let identity_keypair = load_identity_keypair(identity_keypair)?;

    let program = program_setup_govcontract(identity_keypair.clone(), rpc_url.clone()).await?;
    
    let spl_vote_account = find_spl_vote_account(&identity_keypair.pubkey(), &program.rpc()).await?;

    let seed_value = seed.unwrap_or_else(rand::random::<u64>);

    let proposal_pda = derive_proposal_pda(seed_value, &spl_vote_account);

    let proposal_index_pda = derive_proposal_index_pda();

    let spinner = create_spinner("Creating proposal...");

    let sig = program
        .request()
        .args(args::CreateProposal {
            title: proposal_title,
            description: proposal_description,
            start_epoch,
            voting_length_epochs: length,
            seed: seed_value,
        })
        .accounts(accounts::CreateProposal {
            signer: identity_keypair.pubkey(),
            spl_vote_account,
            proposal: proposal_pda,
            proposal_index: proposal_index_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    spinner.finish_with_message(format!(
        "Proposal {} created. https://explorer.solana.com/tx/{}",
        proposal_pda, sig
    ));

    Ok(())
}
