use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::Result;
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

use crate::{
    govcontract::client::{accounts, args},
    utils::{
        api_helpers::{generate_pdas_from_vote_proof_response, get_vote_account_proof},
        utils::{create_spinner, derive_proposal_index_pda, derive_proposal_pda, setup_all},
    },
};

pub async fn create_proposal(
    proposal_title: String,
    proposal_description: String,
    seed: Option<u64>,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    log::debug!(
        "create_proposal: title={}, description={}, seed={:?}, identity_keypair={:?}, rpc_url={:?}",
        proposal_title,
        proposal_description,
        seed,
        identity_keypair,
        rpc_url
    );

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    let seed_value = seed.unwrap_or_else(rand::random::<u64>);

    let proposal_pda = derive_proposal_pda(seed_value, &vote_account, &program.id());

    let proposal_index_pda = derive_proposal_index_pda(&program.id());

    let proof_response = get_vote_account_proof(&vote_account.to_string(), None).await?;

    let (consensus_result_pda, meta_merkle_proof_pda) =
        generate_pdas_from_vote_proof_response(&proof_response)?;
    let voting_wallet = Pubkey::from_str(&proof_response.meta_merkle_leaf.voting_wallet)
        .map_err(|e| anyhow::anyhow!("Invalid voting wallet in proof: {}", e))?;
    if voting_wallet != payer.pubkey() {
        return Err(anyhow::anyhow!(
            "Voting wallet in proof ({}) doesn't match signer ({})",
            voting_wallet,
            payer.pubkey()
        ));
    }

    let spinner = create_spinner("Creating proposal...");

    let sig = program
        .request()
        .args(args::CreateProposal {
            title: proposal_title,
            description: proposal_description,
            seed: seed_value,
        })
        .accounts(accounts::CreateProposal {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pda,
            proposal_index: proposal_index_pda,
            snapshot_program: SNAPSHOT_PROGRAM_ID,
            consensus_result: consensus_result_pda,
            meta_merkle_proof: meta_merkle_proof_pda,
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
