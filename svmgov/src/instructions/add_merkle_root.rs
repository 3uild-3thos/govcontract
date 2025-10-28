use std::str::FromStr;

use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anyhow::{anyhow, Result};

use crate::{
    govcontract::client::{accounts, args},
    utils::utils::{create_spinner, setup_all},
};

pub async fn add_merkle_root(
    proposal_id: String,
    merkle_root_hash: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let spinner = create_spinner("Adding merkle root hash to proposal...");

    let (payer, _payer_pubkey, program, _merkle_proof_program) = setup_all(identity_keypair, rpc_url).await?;

    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID format"))?;

    // Convert hex string to [u8; 32] array
    let merkle_root_bytes = if merkle_root_hash.starts_with("0x") {
        hex::decode(&merkle_root_hash[2..])
    } else {
        hex::decode(&merkle_root_hash)
    }.map_err(|_| anyhow!("Invalid merkle root hash format - must be hex string"))?;

    if merkle_root_bytes.len() != 32 {
        return Err(anyhow!("Merkle root hash must be exactly 32 bytes"));
    }

    let mut merkle_root_array = [0u8; 32];
    merkle_root_array.copy_from_slice(&merkle_root_bytes);

    let signature = program
        .request()
        .args(args::AddMerkleRoot {
            merkle_root_hash: merkle_root_array,
        })
        .accounts(accounts::AddMerkleRoot {
            signer: payer.pubkey(),
            proposal: proposal_pubkey,
        })
        .send()
        .await?;

    spinner.finish_with_message(format!("Merkle root hash added successfully! Signature: {}", signature));

    Ok(())
}
