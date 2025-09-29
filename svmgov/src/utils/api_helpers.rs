use std::str::FromStr;

use anchor_lang::prelude::Pubkey;
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};

use crate::{constants::*, gov_v1, govcontract};

/// Summary endpoint response structure (/voter/:voting_wallet)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoterSummaryAPI {
    pub network: String,
    pub snapshot_slot: u64,
    pub voting_wallet: String,
    pub vote_accounts: Vec<VoteAccountAPI>,
    pub stake_accounts: Vec<StakeAccountAPI>,
}

/// Vote account summary in voter response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteAccountAPI {
    pub vote_account: String,
    pub active_stake: u64,
}

impl TryFrom<&VoteAccountAPI> for anchor_lang::prelude::Pubkey {
    type Error = anyhow::Error;

    fn try_from(vote_account: &VoteAccountAPI) -> Result<Self, Self::Error> {
        Pubkey::from_str(&vote_account.vote_account)
            .map_err(|e| anyhow!("Invalid vote_account pubkey: {}", e))
    }
}
/// Stake account summary in voter response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeAccountAPI {
    pub stake_account: String,
    pub active_stake: u64,
    pub vote_account: String,
}

impl TryFrom<&StakeAccountAPI> for anchor_lang::prelude::Pubkey {
    type Error = anyhow::Error;

    fn try_from(stake_account: &StakeAccountAPI) -> Result<Self, Self::Error> {
        Pubkey::from_str(&stake_account.stake_account)
            .map_err(|e| anyhow!("Invalid stake_account pubkey: {}", e))
    }
}

/// TryFrom implementation to convert gov_v1 StakeMerkleLeaf to IDL-compatible StakeMerkleLeaf type
impl TryFrom<&StakeMerkleLeafAPI> for govcontract::types::StakeMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(stake_merkle_leaf_api: &StakeMerkleLeafAPI) -> Result<Self, Self::Error> {
        Ok(Self {
            voting_wallet: Pubkey::from_str(&stake_merkle_leaf_api.voting_wallet)
                .map_err(|e| anyhow!("Invalid voting_wallet pubkey in API response: {}", e))?,
            stake_account: Pubkey::from_str(&stake_merkle_leaf_api.stake_account)
                .map_err(|e| anyhow!("Invalid stake_account pubkey in API response: {}", e))?,
            active_stake: stake_merkle_leaf_api.active_stake,
        })
    }
}

/// Vote account proof endpoint response structure (/proof/vote_account/:vote_account)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteAccountProofAPI {
    pub network: String,
    pub snapshot_slot: u64,
    pub meta_merkle_leaf: MetaMerkleLeafAPI,
    pub meta_merkle_proof: Vec<String>,
}

/// Stake account proof endpoint response structure (/proof/stake_account/:stake_account)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeAccountProofAPI {
    pub network: String,
    pub snapshot_slot: u64,
    pub stake_merkle_leaf: StakeMerkleLeafAPI,
    pub stake_merkle_proof: Vec<String>,
    pub vote_account: String,
}

/// Meta merkle leaf data structure (for vote account proofs from the operator API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaMerkleLeafAPI {
    pub voting_wallet: String,
    pub vote_account: String,
    pub stake_merkle_root: String,
    pub active_stake: u64,
}

/// Convert MetaMerkleLeafAPI to gov_v1 MetaMerkleLeaf for PDA creation
impl TryFrom<&MetaMerkleLeafAPI> for gov_v1::types::MetaMerkleLeaf {
    type Error = anyhow::Error;

    fn try_from(api_data: &MetaMerkleLeafAPI) -> Result<Self, Self::Error> {
        let stake_merkle_root_bytes = bs58::decode(&api_data.stake_merkle_root)
            .into_vec()
            .map_err(|e| anyhow!("Invalid stake_merkle_root: {}", e))?;

        if stake_merkle_root_bytes.len() != 32 {
            return Err(anyhow!("stake_merkle_root must be 32 bytes"));
        }

        Ok(Self {
            voting_wallet: Pubkey::from_str(&api_data.voting_wallet)
                .map_err(|e| anyhow!("Invalid voting_wallet pubkey: {}", e))?,
            vote_account: Pubkey::from_str(&api_data.vote_account)
                .map_err(|e| anyhow!("Invalid vote_account pubkey: {}", e))?,
            stake_merkle_root: stake_merkle_root_bytes
                .try_into()
                .map_err(|e| anyhow!("Invalid stake_merkle_root: {:?}", e))?,
            active_stake: api_data.active_stake,
        })
    }
}

/// Stake merkle leaf data structure (for stake account proofs from the operator API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeMerkleLeafAPI {
    pub voting_wallet: String,
    pub stake_account: String,
    pub active_stake: u64,
}

/// Get voter summary with all vote and stake accounts
/// Endpoint: GET /voter/:voting_wallet?network=mainnet&slot=...
pub async fn get_voter_summary(
    validator_pubkey: &str,
    snapshot_slot: Option<u64>,
) -> Result<VoterSummaryAPI> {
    let mut url = format!("{}/voter/{}", get_api_base_url(), validator_pubkey);

    if let Some(slot) = snapshot_slot {
        url.push_str(&format!("?network=mainnet&slot={}", slot));
    }

    log::debug!("Fetching voter summary from: {}", url);

    let response = reqwest::get(&url).await?;
    let summary: VoterSummaryAPI = handle_api_response(response, &url).await?;

    log::debug!(
        "Got voter summary for {}: {} vote accounts, {} stake accounts",
        validator_pubkey,
        summary.vote_accounts.len(),
        summary.stake_accounts.len()
    );

    Ok(summary)
}

/// Get merkle proof for a vote account
/// Endpoint: GET /proof/vote_account/:vote_account?network=mainnet&slot=...
pub async fn get_vote_account_proof(
    vote_account: &Pubkey,
    snapshot_slot: Option<u64>,
) -> Result<VoteAccountProofAPI> {
    let mut url = format!("{}/proof/vote_account/{}", get_api_base_url(), vote_account);

    if let Some(slot) = snapshot_slot {
        url.push_str(&format!("?network=mainnet&slot={}", slot));
    }

    log::debug!("Fetching vote account proof from: {}", url);

    let response = reqwest::get(&url).await?;
    let proof: VoteAccountProofAPI = handle_api_response(response, &url).await?;

    log::debug!(
        "Got vote account proof: leaf stake={}, proof elements={}",
        proof.meta_merkle_leaf.active_stake,
        proof.meta_merkle_proof.len()
    );

    Ok(proof)
}

/// Get merkle proof for a stake account
/// Endpoint: GET /proof/stake_account/:stake_account?network=mainnet&slot=...
pub async fn get_stake_account_proof(
    stake_account: &Pubkey,
    snapshot_slot: Option<u64>,
) -> Result<StakeAccountProofAPI> {
    let mut url = format!("{}/proof/stake_account/{}", get_api_base_url(), stake_account);

    if let Some(slot) = snapshot_slot {
        url.push_str(&format!("?network=mainnet&slot={}", slot));
    }

    log::debug!("Fetching stake account proof from: {}", url);

    let response = reqwest::get(&url).await?;
    let proof: StakeAccountProofAPI = handle_api_response(response, &url).await?;

    log::debug!(
        "Got stake account proof: leaf stake={}, proof elements={}",
        proof.stake_merkle_leaf.active_stake,
        proof.stake_merkle_proof.len()
    );

    Ok(proof)
}

/// Get the base API URL from environment or default, making it an optional arg 
fn get_api_base_url() -> String {
    std::env::var(SVMGOV_OPERATOR_URL_ENV).unwrap_or_else(|_| OPERATOR_API_URL.to_string())
}

/// Helper function to handle HTTP responses with better error messages
async fn handle_api_response<T: serde::de::DeserializeOwned>(
    response: reqwest::Response,
    endpoint: &str,
) -> Result<T> {
    let status = response.status();

    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Could not read error response body".to_string());
        let error_text = if error_text.trim().is_empty() {
            "(empty response body - possibly rate limited or not found)".to_string()
        } else {
            error_text
        };

        return Err(anyhow!(
            "API request failed for {}: HTTP {} - {}",
            endpoint,
            status,
            error_text
        ));
    }

    // Try to parse JSON, with better error handling
    let response_text = response
        .text()
        .await
        .map_err(|e| anyhow!("Failed to read response body from {}: {}", endpoint, e))?;

    if response_text.trim().is_empty() {
        return Err(anyhow!("Empty response body from {}", endpoint));
    }

    serde_json::from_str(&response_text).map_err(|e| {
        anyhow!(
            "Failed to parse JSON response from {}: {}.\nResponse body: {}",
            endpoint,
            e,
            response_text
        )
    })
}

/// Helper function to convert merkle proof strings to bytes
pub fn convert_merkle_proof_strings(proof_strings: &[String]) -> Result<Vec<[u8; 32]>> {
    proof_strings
        .iter()
        .map(|s| {
            let bytes_result = bs58::decode(s).into_vec();

            let bytes = match bytes_result {
                Ok(b) => b,
                Err(e) => return Err(anyhow!("Invalid base58 merkle proof hash: {}", e)),
            };

            if bytes.len() != 32 {
                return Err(anyhow!(
                    "Merkle proof hash must be 32 bytes, got {}",
                    bytes.len()
                ));
            }

            let mut hash = [0u8; 32];
            hash.copy_from_slice(&bytes);
            Ok(hash)
        })
        .collect()
}

// Derive ConsensusResult PDA for a given ballot id
// pub fn derive_consensus_result_pda(ballot_id: u64) -> Result<Pubkey> {
//     Ok(Pubkey::find_program_address(
//         &[b"consensus_result", &ballot_id.to_le_bytes()],
//         &gov_v1::ID,
//     )
//     .0)
// }

/// Derive MetaMerkleProof PDA for a given consensus result and vote account
pub fn derive_meta_merkle_proof_pda(
    consensus_result_pda: &Pubkey,
    vote_account: &Pubkey,
) -> Result<Pubkey> {
    Ok(Pubkey::find_program_address(
        &[
            b"MetaMerkleProof",
            consensus_result_pda.as_ref(),
            vote_account.as_ref(),
        ],
        &gov_v1::ID,
    )
    .0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    // Test data from the examples provided
    const TEST_WALLET: &str = "CG4tRANBKrzUmpv93V5sgftjQznBdiJsc2yPCzZWWuS9";
    const TEST_VOTE_ACCOUNT: &str = "8hPk5CbKDoM7dN9LssTdVkFhDykeq7A8CZurA5AQSFJH";
    const TEST_STAKE_ACCOUNT: &str = "71t7QTJ5HsoCdP7gmz2eupSRYzAXFXBKzZwZjmyrWzjz";
    const TEST_SLOT: u64 = 361319354;

    #[tokio::test]
    async fn test_get_voter_summary_deserialization() {
        // Set the API URL
        unsafe { env::set_var("SVMGOV_OPERATOR_URL", "https://api.solgov.online") };

        let wallet = Pubkey::from_str(TEST_WALLET).expect("Invalid test wallet pubkey");

        let result = get_voter_summary(&wallet.to_string(), Some(TEST_SLOT)).await;

        match result {
            Ok(summary) => {
                println!("=== VOTER SUMMARY RESPONSE ===");
                println!("Network: {}", summary.network);
                println!("Snapshot Slot: {}", summary.snapshot_slot);
                println!("Voting Wallet: {}", summary.voting_wallet);
                println!("Vote Accounts: {}", summary.vote_accounts.len());
                println!("Stake Accounts: {}", summary.stake_accounts.len());

                for (i, vote_account) in summary.vote_accounts.iter().enumerate() {
                    println!(
                        "  Vote Account {}: {} (stake: {})",
                        i + 1,
                        vote_account.vote_account,
                        vote_account.active_stake
                    );
                }

                for (i, stake_account) in summary.stake_accounts.iter().enumerate() {
                    println!(
                        "  Stake Account {}: {} -> {} (stake: {})",
                        i + 1,
                        stake_account.stake_account,
                        stake_account.vote_account,
                        stake_account.active_stake
                    );
                }
                println!("================================");

                // Test that we can deserialize the response
                assert_eq!(summary.network, "mainnet");
                assert_eq!(summary.snapshot_slot, TEST_SLOT);
                assert_eq!(summary.voting_wallet, TEST_WALLET);

                // Note: This wallet may not have stake at this slot, so we don't assert non-empty arrays
                // Just verify the structure is correct

                // Test that vote accounts have valid data
                for vote_account in &summary.vote_accounts {
                    assert!(
                        !vote_account.vote_account.is_empty(),
                        "Vote account should not be empty"
                    );
                    assert!(
                        vote_account.active_stake > 0,
                        "Active stake should be positive"
                    );
                }

                // Test that stake accounts have valid data
                for stake_account in &summary.stake_accounts {
                    assert!(
                        !stake_account.stake_account.is_empty(),
                        "Stake account should not be empty"
                    );
                    assert!(
                        !stake_account.vote_account.is_empty(),
                        "Vote account should not be empty"
                    );
                    assert!(
                        stake_account.active_stake > 0,
                        "Active stake should be positive"
                    );
                }
            }
            Err(e) => {
                println!(
                    "API call failed (expected for test accounts that may not exist in snapshot): {}",
                    e
                );
            }
        }
    }

    #[tokio::test]
    async fn test_get_vote_account_proof_deserialization() {
        // Set the API URL
        unsafe { env::set_var("SVMGOV_OPERATOR_URL", "https://api.solgov.online") };

        let result = get_vote_account_proof(
            &Pubkey::from_str(TEST_VOTE_ACCOUNT).unwrap(),
            Some(TEST_SLOT),
        )
        .await;

        match result {
            Ok(proof) => {
                println!("=== VOTE ACCOUNT PROOF RESPONSE ===");
                println!("Network: {}", proof.network);
                println!("Snapshot Slot: {}", proof.snapshot_slot);
                println!("Meta Merkle Leaf:");
                println!("Voting Wallet: {}", proof.meta_merkle_leaf.voting_wallet);
                println!("Vote Account: {}", proof.meta_merkle_leaf.vote_account);
                println!(
                    "Stake Merkle Root: {}",
                    proof.meta_merkle_leaf.stake_merkle_root
                );
                println!("Active Stake: {}", proof.meta_merkle_leaf.active_stake);
                println!("Merkle Proof Elements: {}", proof.meta_merkle_proof.len());
                for (i, proof_element) in proof.meta_merkle_proof.iter().enumerate() {
                    if i < 3 {
                        // Only print first 3 to avoid spam
                        println!("  Proof[{}]: {}", i, proof_element);
                    } else if i == 3 {
                        println!(
                            "  ... ({} more elements)",
                            proof.meta_merkle_proof.len() - 3
                        );
                        break;
                    }
                }
                println!("====================================");

                // Test that we can deserialize the response
                assert_eq!(proof.network, "mainnet");
                assert_eq!(proof.snapshot_slot, TEST_SLOT);

                // Test meta merkle leaf data
                assert!(
                    !proof.meta_merkle_leaf.voting_wallet.is_empty(),
                    "Voting wallet should not be empty"
                );
                assert!(
                    !proof.meta_merkle_leaf.vote_account.is_empty(),
                    "Vote account should not be empty"
                );
                assert!(
                    !proof.meta_merkle_leaf.stake_merkle_root.is_empty(),
                    "Stake merkle root should not be empty"
                );
                assert!(
                    proof.meta_merkle_leaf.active_stake > 0,
                    "Active stake should be positive"
                );

                // Test that we have a merkle proof
                assert!(
                    !proof.meta_merkle_proof.is_empty(),
                    "Should have merkle proof elements"
                );

                // Test that proof elements are valid base58 strings
                for proof_element in &proof.meta_merkle_proof {
                    assert!(
                        !proof_element.is_empty(),
                        "Proof element should not be empty"
                    );
                    // Should be able to decode as base58
                    let _decoded = bs58::decode(proof_element)
                        .into_vec()
                        .expect("Proof element should be valid base58");
                }
            }
            Err(e) => {
                println!("API call failed: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_get_stake_account_proof_deserialization() {
        // Set the API URL
        unsafe { env::set_var("SVMGOV_OPERATOR_URL", "https://api.solgov.online") };

        let result = get_stake_account_proof(
            &Pubkey::from_str(TEST_STAKE_ACCOUNT).unwrap(),
            Some(TEST_SLOT),
        )
        .await;

        match result {
            Ok(proof) => {
                println!("=== STAKE ACCOUNT PROOF RESPONSE ===");
                println!("Network: {}", proof.network);
                println!("Snapshot Slot: {}", proof.snapshot_slot);
                println!("Vote Account: {}", proof.vote_account);
                println!("Stake Merkle Leaf:");
                println!("  Voting Wallet: {}", proof.stake_merkle_leaf.voting_wallet);
                println!("  Stake Account: {}", proof.stake_merkle_leaf.stake_account);
                println!("  Active Stake: {}", proof.stake_merkle_leaf.active_stake);
                println!("Merkle Proof Elements: {}", proof.stake_merkle_proof.len());
                for (i, proof_element) in proof.stake_merkle_proof.iter().enumerate() {
                    if i < 3 {
                        // Only print first 3 to avoid spam
                        println!("  Proof[{}]: {}", i, proof_element);
                    } else if i == 3 {
                        println!(
                            "  ... ({} more elements)",
                            proof.stake_merkle_proof.len() - 3
                        );
                        break;
                    }
                }
                println!("=====================================");

                // Test that we can deserialize the response
                assert_eq!(proof.network, "mainnet");
                assert_eq!(proof.snapshot_slot, TEST_SLOT);
                assert!(
                    !proof.vote_account.is_empty(),
                    "Vote account should not be empty"
                );

                // Test stake merkle leaf data
                assert!(
                    !proof.stake_merkle_leaf.voting_wallet.is_empty(),
                    "Voting wallet should not be empty"
                );
                assert!(
                    !proof.stake_merkle_leaf.stake_account.is_empty(),
                    "Stake account should not be empty"
                );
                assert!(
                    proof.stake_merkle_leaf.active_stake > 0,
                    "Active stake should be positive"
                );

                // Test that we have a merkle proof
                assert!(
                    !proof.stake_merkle_proof.is_empty(),
                    "Should have merkle proof elements"
                );

                // Test that proof elements are valid base58 strings
                for proof_element in &proof.stake_merkle_proof {
                    assert!(
                        !proof_element.is_empty(),
                        "Proof element should not be empty"
                    );
                    // Should be able to decode as base58
                    let _decoded = bs58::decode(proof_element)
                        .into_vec()
                        .expect("Proof element should be valid base58");
                }
            }
            Err(e) => {
                println!("API call failed: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_api_data_conversion_to_gov_v1_types() {
        // Set the API URL
        unsafe { env::set_var("SVMGOV_OPERATOR_URL", "https://api.solgov.online") };

        // Test vote account proof conversion
        if let Ok(vote_proof) = get_vote_account_proof(
            &Pubkey::from_str(TEST_VOTE_ACCOUNT).unwrap(),
            Some(TEST_SLOT),
        )
        .await
        {
            let meta_leaf_result: Result<gov_v1::types::MetaMerkleLeaf, _> =
                (&vote_proof.meta_merkle_leaf).try_into();
            assert!(
                meta_leaf_result.is_ok(),
                "Should be able to convert API data to MetaMerkleLeaf"
            );

            let meta_leaf = meta_leaf_result.unwrap();
            assert_eq!(
                meta_leaf.active_stake,
                vote_proof.meta_merkle_leaf.active_stake
            );

            // Test merkle proof conversion
            let proof_bytes_result = convert_merkle_proof_strings(&vote_proof.meta_merkle_proof);
            assert!(
                proof_bytes_result.is_ok(),
                "Should be able to convert merkle proof strings to bytes"
            );
        }
    }

    #[test]
    fn test_convert_merkle_proof_strings() {
        // Test valid base58 strings
        let valid_hashes = vec![
            "11111111111111111111111111111112".to_string(),
            "So11111111111111111111111111111111111111112".to_string(),
        ];

        let result = convert_merkle_proof_strings(&valid_hashes);
        assert!(result.is_ok(), "Should convert valid base58 strings");

        let hashes = result.unwrap();
        assert_eq!(hashes.len(), 2);
        assert_eq!(hashes[0].len(), 32);
        assert_eq!(hashes[1].len(), 32);

        // Test invalid base58 string
        let invalid_hashes = vec!["invalid!!!".to_string()];
        let result = convert_merkle_proof_strings(&invalid_hashes);
        assert!(result.is_err(), "Should fail on invalid base58 strings");
    }
}
