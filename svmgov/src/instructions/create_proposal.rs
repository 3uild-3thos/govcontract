use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::Result;

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

    // Load identity keypair, set up cluster and rpc_client, find native vote accunt
    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;
    log::debug!(
        "setup_all complete: payer_pubkey={}, vote_account={}",
        payer.pubkey(),
        vote_account
    );

    // Generate or use provided seed
    let seed_value = seed.unwrap_or_else(|| rand::random::<u64>());
    log::debug!("Using seed_value: {}", seed_value);

    let payer_pubkey = payer.pubkey();
    let proposal_seeds = &[
        b"proposal",
        &seed_value.to_le_bytes(),
        payer_pubkey.as_ref(),
    ];
    let (proposal_pda, _bump) = Pubkey::find_program_address(proposal_seeds, &program.id());
    log::debug!("Derived proposal PDA: {}", proposal_pda);

    // Build and send the transaction
    log::debug!("Building and sending CreateProposal transaction");
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
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    println!(
        "Proposal {} created. https://explorer.solana.com/tx/{}",
        proposal_pda, sig
    );

    Ok(())
}