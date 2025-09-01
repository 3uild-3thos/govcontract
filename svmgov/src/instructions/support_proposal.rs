use std::str::FromStr;

use crate::{
    create_spinner,
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};

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

    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    let support_seeds = &[b"support", proposal_pubkey.as_ref(), vote_account.as_ref()];
    let (support_pda, _bump) = Pubkey::find_program_address(support_seeds, &program.id());
    log::debug!("Derived support_pda: {}", support_pda);

    // Create a spinner for progress indication
    let spinner = create_spinner("Supporting proposal...");

    log::debug!("Building and sending SupportProposal transaction");
    let sig = program
        .request()
        .args(args::SupportProposal {
            proposal_id: proposal_pubkey,
            meta_merkle_leaf: todo!("Implement meta merkle leaf"),
            meta_merkle_proof: vec![], // Empty proof for now
        })
        .accounts(accounts::SupportProposal {
            signer: payer.pubkey(),
            proposal: proposal_pubkey,
            support: support_pda,
            consensus_result: Pubkey::new_unique(), // Mock consensus result
            snapshot_program: Pubkey::new_unique(), // Mock snapshot program
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
