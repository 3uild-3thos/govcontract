use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

use crate::{
    gov_v1,
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{get_vote_account_proof, get_voter_summary},
        utils::{
            create_spinner, derive_support_pda, ensure_meta_merkle_proof_initialized,
            load_identity_keypair, program_setup_govcontract,
        },
    },
};

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    spl_vote_account: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let identity_keypair = load_identity_keypair(identity_keypair)?;
    let program = program_setup_govcontract(identity_keypair.clone(), rpc_url.clone()).await?;
    let voter_summary = get_voter_summary(&identity_keypair.pubkey().to_string(), None).await?;
    let spl_vote_account = if let Some(spl_vote_account) = spl_vote_account {
        Pubkey::from_str(&spl_vote_account).map_err(|_| anyhow!("Invalid vote account: {}", spl_vote_account))?
    } else {
        (&voter_summary.vote_accounts[0]).try_into()?
    };
    let validator_vote_proof =
        get_vote_account_proof(&spl_vote_account, None).await?;

    let support_pda = derive_support_pda(&proposal_pubkey, &spl_vote_account);

    // Ensure MetaMerkleProof PDA is initialized
    let (consensus_result_pda, meta_merkle_proof_pda) = ensure_meta_merkle_proof_initialized(
        &proposal_id,
        &validator_vote_proof,
        0i64,
        identity_keypair.clone(),
        rpc_url.clone(),
    )
    .await?;

    let spinner = create_spinner("Supporting proposal...");

    let sig = program
        .request()
        .args(args::SupportProposal { spl_vote_account })
        .accounts(accounts::SupportProposal {
            signer: identity_keypair.pubkey(),
            proposal: proposal_pubkey,
            support: support_pda,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            system_program: system_program::ID,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Proposal supported. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}
