use anchor_lang::prelude::{borsh::{self, BorshDeserialize, BorshSerialize}, Pubkey};
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use crate::constants::*;

// API Response Data Structures

/// Summary endpoint response structure (/voter/:voting_wallet)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoterSummaryResponse {
    pub network: String,
    pub snapshot_slot: u64,
    pub voting_wallet: String,
    pub vote_accounts: Vec<VoteAccountSummary>,
    pub stake_accounts: Vec<StakeAccountSummary>,
}

/// Vote account summary in voter response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteAccountSummary {
    pub vote_account: String,
    pub active_stake: u64,
}

/// Stake account summary in voter response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeAccountSummary {
    pub stake_account: String,
    pub active_stake: u64,
    pub vote_account: String,
}

/// Vote account proof endpoint response structure (/proof/vote_account/:vote_account)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteAccountProofResponse {
    pub network: String,
    pub snapshot_slot: u64,
    pub meta_merkle_leaf: MetaMerkleLeafData,
    pub meta_merkle_proof: Vec<String>,
}

/// Stake account proof endpoint response structure (/proof/stake_account/:stake_account)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeAccountProofResponse {
    pub network: String,
    pub snapshot_slot: u64,
    pub stake_merkle_leaf: StakeMerkleLeafData,
    pub stake_merkle_proof: Vec<String>,
    pub vote_account: String,
}

/// Meta merkle leaf data structure (for vote account proofs)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaMerkleLeafData {
    pub voting_wallet: String,
    pub vote_account: String,
    pub stake_merkle_root: String,
    pub active_stake: u64,
}

/// Stake merkle leaf data structure (for stake account proofs)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeMerkleLeafData {
    pub voting_wallet: String,
    pub stake_account: String,
    pub active_stake: u64,
}


// API Helper Functions

/// Get voter summary with all vote and stake accounts
/// Endpoint: GET /voter/:voting_wallet?snapshot_slot=...
pub async fn get_voter_summary(wallet: &str, snapshot_slot: Option<u64>) -> Result<VoterSummaryResponse> {
    let base_url = get_api_base_url();
    let mut url = format!("{}/voter/{}", base_url, wallet);

    if let Some(slot) = snapshot_slot {
        url.push_str(&format!("?snapshot_slot={}", slot));
    }

    log::debug!("Fetching voter summary from: {}", url);

    let response = reqwest::get(&url).await?;
    let summary: VoterSummaryResponse = response.json().await?;

    log::debug!(
        "Got voter summary for {}: {} vote accounts, {} stake accounts",
        wallet,
        summary.vote_accounts.len(),
        summary.stake_accounts.len()
    );

    Ok(summary)
}

/// Get merkle proof for a vote account
/// Endpoint: GET /proof/vote_account/:vote_account?snapshot_slot=...
pub async fn get_vote_account_proof(vote_account: &str, snapshot_slot: Option<u64>) -> Result<VoteAccountProofResponse> {
    let base_url = get_api_base_url();
    let mut url = format!("{}/proof/vote_account/{}", base_url, vote_account);

    if let Some(slot) = snapshot_slot {
        url.push_str(&format!("?snapshot_slot={}", slot));
    }

    log::debug!("Fetching vote account proof from: {}", url);

    let response = reqwest::get(&url).await?;
    let proof: VoteAccountProofResponse = response.json().await?;

    log::debug!(
        "Got vote account proof: leaf stake={}, proof elements={}",
        proof.meta_merkle_leaf.active_stake,
        proof.meta_merkle_proof.len()
    );

    Ok(proof)
}

/// Get merkle proof for a stake account
/// Endpoint: GET /proof/stake_account/:stake_account?snapshot_slot=...
pub async fn get_stake_account_proof(stake_account: &str, snapshot_slot: Option<u64>) -> Result<StakeAccountProofResponse> {
    let base_url = get_api_base_url();
    let mut url = format!("{}/proof/stake_account/{}", base_url, stake_account);

    if let Some(slot) = snapshot_slot {
        url.push_str(&format!("?snapshot_slot={}", slot));
    }

    log::debug!("Fetching stake account proof from: {}", url);

    let response = reqwest::get(&url).await?;
    let proof: StakeAccountProofResponse = response.json().await?;

    log::debug!(
        "Got stake account proof: leaf stake={}, proof elements={}",
        proof.stake_merkle_leaf.active_stake,
        proof.stake_merkle_proof.len()
    );

    Ok(proof)
}

/// Get the base API URL from environment or default
fn get_api_base_url() -> String {
    std::env::var(OPERATOR_API_URL_ENV)
        .unwrap_or_else(|_| DEFAULT_OPERATOR_API_URL.to_string())
}
