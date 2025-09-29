use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anyhow::{Result, anyhow};
use gov_v1::ConsensusResult;

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{
        create_spinner, load_identity_keypair, program_setup_gov_v1, program_setup_govcontract,
    },
};

pub async fn add_merkle_root(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
    consensus_result_pda: String,
) -> Result<()> {
    let spinner = create_spinner("Adding merkle root hash to proposal...");

    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let identity_keypair = load_identity_keypair(identity_keypair)?;
    let program = program_setup_govcontract(identity_keypair.clone(), rpc_url.clone()).await?;
    let gov_v1_program = program_setup_gov_v1(identity_keypair.clone(), rpc_url.clone()).await?;
    let _consensus_result = gov_v1_program
        .account::<ConsensusResult>(
            Pubkey::from_str(&consensus_result_pda)
                .map_err(|_| anyhow!("Invalid consensus result PDA: {}", consensus_result_pda))?,
        )
        .await
        .map_err(|_| anyhow!("Consensus result not found"))?;

    let signature = program
        .request()
        .args(args::AddMerkleRoot {})
        .accounts(accounts::AddMerkleRoot {
            signer: identity_keypair.pubkey(),
            proposal: proposal_pubkey,
            consensus_result: Pubkey::from_str(&consensus_result_pda)?,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!(
        "Merkle root hash added successfully! Signature: {}",
        signature
    ));

    Ok(())
}
