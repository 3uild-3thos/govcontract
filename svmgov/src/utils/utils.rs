use anchor_client::{
    solana_account_decoder::UiAccountEncoding, solana_client::{nonblocking::rpc_client::RpcClient, rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig}, rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType}}, solana_sdk::{commitment_config::{CommitmentConfig, CommitmentLevel}, signature::Keypair, signer::Signer, stake::{self, state::StakeStateV2}}, Client, Cluster, Program
};
use anchor_lang::{prelude::Pubkey, AnchorDeserialize, Id};
use anyhow::{Result, anyhow};
use chrono::prelude::*;
use std::{collections::HashMap, fmt, fs, str::FromStr, sync::Arc};
use textwrap::wrap;

use crate::govcontract::{
    accounts::{Proposal, Vote},
    program::Govcontract,
};

pub async fn setup_all(
    keypair_path: Option<String>,
    rpc_url: Option<String>,
) -> Result<(Arc<Keypair>, Pubkey, Program<Arc<Keypair>>)> {
    // Step 1: Load the identity keypair
    let identity_keypair = load_identity_keypair(keypair_path)?;
    let identity_keypair_arc = Arc::new(identity_keypair);

    // Step 2: Set the cluster
    let cluster = set_cluster(rpc_url);

    // Step 3: Create the Anchor client and program
    let client = Client::new(cluster.clone(), identity_keypair_arc.clone());
    let program = client.program(Govcontract::id())?;

    // Step 4: Find the vote account using the program's RpcClient
    let rpc_client = program.rpc();
    let validator_identity = identity_keypair_arc.pubkey();
    let vote_account = find_spl_vote_account(&validator_identity, &rpc_client).await?;

    // Step 5: Return all variables
    Ok((identity_keypair_arc, vote_account, program))
}

fn load_identity_keypair(keypair_path: Option<String>) -> Result<Keypair> {
    // Check if the keypair path is provided
    let identity_keypair_path = if let Some(path) = keypair_path {
        path
    } else {
        return Err(anyhow!(
            "No identity keypair path provided. Please specify the path using the --identity_keypair flag."
        ));
    };

    // Read the file content, handling specific errors like file not found
    let file_content = fs::read_to_string(&identity_keypair_path).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => {
            anyhow!(
                "The specified keypair file does not exist: {}",
                identity_keypair_path
            )
        }
        _ => anyhow!(
            "Failed to read keypair file {}: {}",
            identity_keypair_path,
            e
        ),
    })?;

    // Parse the JSON content into a vector of bytes
    let keypair_bytes: Vec<u8> = serde_json::from_str(&file_content).map_err(|e| {
        anyhow!(
            "The keypair file is not a valid JSON array of bytes: {}. Error: {}",
            identity_keypair_path,
            e
        )
    })?;

    // Create the Keypair from the bytes
    let identity_keypair = Keypair::from_bytes(&keypair_bytes).map_err(|e| {
        anyhow!(
            "The provided bytes do not form a valid Solana keypair: {}. This might be due to invalid key data.",
            e
        )
    })?;

    println!(
        "Loaded identity keypair address -> {:?}",
        identity_keypair.pubkey()
    );

    Ok(identity_keypair)
}

async fn find_spl_vote_account(
    validator_identity: &Pubkey,
    rpc_client: &RpcClient,
) -> Result<Pubkey> {
    let vote_accounts = rpc_client.get_vote_accounts().await?;

    let vote_account = vote_accounts
        .current
        .iter()
        .find(|vote_acc| vote_acc.node_pubkey == validator_identity.to_string())
        .ok_or(anyhow!(
            "No Vote account found associated with this validator identity"
        ))?;

    Ok(Pubkey::from_str(&vote_account.vote_pubkey)?)
}

// Returns a vector with vote account pubkeys sequentially collected
pub async fn find_spl_vote_accounts(
    validator_identities: Vec<&Pubkey>,
    rpc_client: &RpcClient,
) -> Result<Vec<Pubkey>> {
    log::debug!(
        "find_spl_vote_accounts called with validator_identities: {:?}",
        validator_identities
    );

    let vote_accounts = rpc_client.get_vote_accounts().await?;
    log::debug!(
        "Fetched {} current vote accounts from RPC",
        vote_accounts.current.len()
    );

    let mut spl_vote_pubkeys = Vec::with_capacity(validator_identities.len());

    // Map of node_pubkey to vote_pubkey
    let vote_account_map = vote_accounts
        .current
        .iter()
        .filter_map(|vote_acc| {
            Pubkey::from_str(&vote_acc.node_pubkey)
                .ok()
                .map(|pk| Ok((pk, Pubkey::from_str(&vote_acc.vote_pubkey)?)))
        })
        .collect::<Result<HashMap<_, _>>>()?;
    log::debug!(
        "Constructed vote_account_map with {} entries",
        vote_account_map.len()
    );

    // Build the result in the order of validator_identities
    for identity in validator_identities {
        if let Some(vote_pubkey) = vote_account_map.get(identity) {
            log::debug!(
                "Found SPL vote pubkey {} for validator identity {}",
                vote_pubkey,
                identity
            );
            spl_vote_pubkeys.push(*vote_pubkey);
        } else {
            log::debug!(
                "No SPL vote account found for validator identity {}",
                identity
            );
            return Err(anyhow!(
                "No SPL vote account found for validator identity {}",
                identity
            ));
        }
    }

    log::debug!("Returning SPL vote pubkeys: {:?}", spl_vote_pubkeys);
    Ok(spl_vote_pubkeys)
}

pub(crate) async fn find_delegator_stake_accounts(
    withdraw_authority: &Pubkey,
    rpc_client: &RpcClient,
) -> Result<Vec<(Pubkey, Pubkey, u64)>> {

    let filters = vec![
        RpcFilterType::DataSize(200),
        RpcFilterType::Memcmp(Memcmp::new(44, MemcmpEncodedBytes::Bytes(withdraw_authority.to_bytes().to_vec())),
    )];

    let config = RpcProgramAccountsConfig { 
        filters: Some(filters), 
        account_config: RpcAccountInfoConfig { 
            encoding: Some(UiAccountEncoding::JsonParsed), 
            commitment: Some(CommitmentConfig { commitment: CommitmentLevel::Finalized }),
            .. RpcAccountInfoConfig::default()
        }, 
        with_context: None, 
        sort_results: Some(true) 
    };

    let accounts = rpc_client
        .get_program_accounts_with_config(&stake::program::id(), config)
        .await?;

    let mut stakes = vec![];

    for (stake_pubkey, account) in accounts {
        if let Ok(StakeStateV2::Stake(_meta, stake, _flags)) = StakeStateV2::deserialize(&mut &account.data[..]) {
            if stake.delegation.stake > 0 && stake.delegation.deactivation_epoch == u64::MAX {
                stakes.push((
                    stake_pubkey,
                    stake.delegation.voter_pubkey,
                    stake.delegation.stake,
                ));
            }
        }
    }

    if stakes.is_empty() {
        return Err(anyhow!("No active stake accounts found for this delegator"));
    }

    Ok(stakes)
}

fn set_cluster(rpc_url: Option<String>) -> Cluster {
    if let Some(rpc_url) = rpc_url {
        let wss_url = rpc_url.replace("https://", "wss://");
        Cluster::Custom(rpc_url, wss_url)
    } else {
        Cluster::Custom(
            "https://api.mainnet-beta.solana.com".to_string(),
            "wss://api.mainnet-beta.solana.com".to_string(),
        )
    }
}

pub fn anchor_client_setup(
    rpc_url: Option<String>,
    payer: Arc<Keypair>,
) -> Result<Program<Arc<Keypair>>> {
    // Set up the cluster
    let cluster = set_cluster(rpc_url);

    // Create the Anchor client
    let client = Client::new(cluster, payer.clone());
    let program = client.program(Govcontract::id())?;
    Ok(program)
}

impl fmt::Display for Proposal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let author_str = self.author.to_string();
        let short_author = format!(
            "{}...{}",
            &author_str[..4],
            &author_str[author_str.len() - 4..]
        );
        let wrapped_desc = wrap(&self.description, 80);

        writeln!(f, "{:<25} {}", "Proposal:", self.title)?;
        writeln!(f, "{:<25} {}", "Author:", short_author)?;
        writeln!(f, "{:<25} epoch {}", "Created:", self.creation_epoch)?;
        writeln!(f, "{:<25} epoch {}", "Starts:", self.start_epoch)?;
        writeln!(f, "{:<25} epoch {}", "Ends:", self.end_epoch)?;
        writeln!(
            f,
            "{:<25} {} bp ({:.2}%)",
            "Proposer Stake Weight:",
            self.proposer_stake_weight_bp,
            self.proposer_stake_weight_bp as f64 / 100.0
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "Cluster Support:",
            self.cluster_support_lamports,
            self.cluster_support_lamports as f64 / 1_000_000_000.0
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "For Votes:",
            self.for_votes_lamports,
            self.for_votes_lamports as f64 / 1_000_000_000.0
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "Against Votes:",
            self.against_votes_lamports,
            self.against_votes_lamports as f64 / 1_000_000_000.0
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "Abstain Votes:",
            self.abstain_votes_lamports,
            self.abstain_votes_lamports as f64 / 1_000_000_000.0
        )?;
        writeln!(
            f,
            "{:<25} {}",
            "Voting:",
            if self.voting { "Yes" } else { "No" }
        )?;
        writeln!(
            f,
            "{:<25} {}",
            "Finalized:",
            if self.finalized { "Yes" } else { "No" }
        )?;
        writeln!(f, "{:<25}", "Description:")?;
        for line in wrapped_desc {
            writeln!(f, "  {}", line)?;
        }
        Ok(())
    }
}

impl fmt::Display for Vote {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let validator_str = self.validator.to_string();
        let short_validator = format!(
            "{}...{}",
            &validator_str[..4],
            &validator_str[validator_str.len() - 4..]
        );
        let proposal_str = self.proposal.to_string();
        let short_proposal = format!(
            "{}...{}",
            &proposal_str[..4],
            &proposal_str[proposal_str.len() - 4..]
        );
        let timestamp = Utc
            .timestamp_opt(self.vote_timestamp, 0)
            .single()
            .unwrap_or_default();
        let formatted_timestamp = timestamp.format("%Y-%m-%d %H:%M:%S UTC").to_string();

        writeln!(f, "{:<15} {}", "Validator:", short_validator)?;
        writeln!(f, "{:<15} {}", "Proposal:", short_proposal)?;
        writeln!(
            f,
            "{:<15} {} bp ({:.2}%)",
            "For Votes:",
            self.for_votes_bp,
            self.for_votes_bp as f64 / 100.0
        )?;
        writeln!(
            f,
            "{:<15} {} bp ({:.2}%)",
            "Against Votes:",
            self.against_votes_bp,
            self.against_votes_bp as f64 / 100.0
        )?;
        writeln!(
            f,
            "{:<15} {} bp ({:.2}%)",
            "Abstain Votes:",
            self.abstain_votes_bp,
            self.abstain_votes_bp as f64 / 100.0
        )?;
        writeln!(f, "{:<15} {}", "Timestamp:", formatted_timestamp)?;
        Ok(())
    }
}

// Snapshot data structure
pub struct SnapshotData {
    pub validator_vote_account: Pubkey,
    pub stake_account: Pubkey,
    pub validator_vote_pda: Pubkey,
    pub vote_override_pda: Pubkey,
    pub snapshot_program: Pubkey,
    pub merkle_proof: Vec<[u8; 32]>,
}

pub async fn fetch_snapshot_data(
    delegator: &Pubkey,
    proposal: &Pubkey,
    operator_api: Option<String>,
) -> Result<SnapshotData> {
    let api_url = operator_api.unwrap_or_else(|| {
        std::env::var("OPERATOR_API_URL").unwrap_or_else(|_| "https://api.operator.com".to_string())
    });

    println!("🌐 Fetching snapshot data from: {}", api_url);

    // TODO: Implement actual API call to operator
    // For now, return mock data so the CLI can function
    
    // Generate mock PDAs for testing
    let validator_vote_account = Pubkey::new_unique(); // Mock validator vote account
    let stake_account = Pubkey::new_unique(); // Mock stake account
    let snapshot_program = Pubkey::new_unique(); // Mock snapshot program
    
    // Derive PDAs using the same seeds as the contract
    let validator_vote_seeds = &[b"vote", proposal.as_ref(), validator_vote_account.as_ref()];
    let (validator_vote_pda, _) = Pubkey::find_program_address(validator_vote_seeds, &Pubkey::new_unique());
    
    let vote_override_seeds = &[b"vote_override", proposal.as_ref(), stake_account.as_ref()];
    let (vote_override_pda, _) = Pubkey::find_program_address(vote_override_seeds, &Pubkey::new_unique());
    
    // Mock merkle proof (32 bytes each)
    let merkle_proof = vec![[0u8; 32]; 3]; // Mock 3-level proof

    Ok(SnapshotData {
        validator_vote_account,
        stake_account,
        validator_vote_pda,
        vote_override_pda,
        snapshot_program,
        merkle_proof,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use anchor_client::solana_sdk::signature::Keypair;
    use anchor_client::solana_sdk::signer::Signer;
    use anchor_lang::Id;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::Arc;
    use tempfile::NamedTempFile;

    // Helper function to create a temporary keypair file
    fn create_temp_keypair_file() -> (NamedTempFile, PathBuf, Keypair) {
        let keypair = Keypair::new();
        let temp_file = NamedTempFile::new().unwrap();
        let path = temp_file.path().to_path_buf();
        let keypair_bytes = keypair.to_bytes().to_vec();
        fs::write(&path, serde_json::to_string(&keypair_bytes).unwrap()).unwrap();
        (temp_file, path, keypair)
    }

    // Test for load_identity_keypair success
    #[test]
    fn test_load_identity_keypair_success() {
        let (_temp_file, temp_path, expected_keypair) = create_temp_keypair_file();
        println!("{}", temp_path.to_str().unwrap().to_string());
        let keypair_path = Some(temp_path.to_str().unwrap().to_string());
        let result = load_identity_keypair(keypair_path);
        assert!(result.is_ok(), "Expected Ok, got {:?}", result);
        let loaded_keypair = result.unwrap();
        assert_eq!(
            loaded_keypair.pubkey(),
            expected_keypair.pubkey(),
            "Loaded keypair pubkey does not match expected"
        );
        // temp_file is dropped here, after all operations are complete
    }

    #[test]
    fn test_load_identity_keypair_no_path() {
        let result = load_identity_keypair(None);
        assert!(result.is_err(), "Expected Err, got {:?}", result);
        assert_eq!(
            result.unwrap_err().to_string(),
            "No identity keypair path provided. Please specify the path using the --identity_keypair flag.",
            "Unexpected error message"
        );
    }

    #[test]
    fn test_load_identity_keypair_invalid_file() {
        let invalid_path = Some("invalid/path/to/keypair.json".to_string());
        let result = load_identity_keypair(invalid_path);
        assert!(result.is_err(), "Expected Err, got {:?}", result.as_ref());
        let error_msg = result.as_ref().unwrap_err().to_string();
        assert!(
            error_msg.contains("The specified keypair file does not exist"),
            "Unexpected error message: {}",
            error_msg
        );
    }

    // Tests for set_cluster
    #[test]
    fn test_set_cluster_custom_url() {
        let custom_rpc_url = Some("https://custom.rpc.url".to_string());
        let cluster = set_cluster(custom_rpc_url);
        match cluster {
            Cluster::Custom(rpc, wss) => {
                assert_eq!(rpc, "https://custom.rpc.url", "RPC URL mismatch");
                assert_eq!(wss, "wss://custom.rpc.url", "WSS URL mismatch");
            }
            _ => panic!("Expected Cluster::Custom, got {:?}", cluster),
        }
    }

    #[test]
    fn test_set_cluster_default_url() {
        let cluster = set_cluster(None);
        match cluster {
            Cluster::Custom(rpc, wss) => {
                assert_eq!(
                    rpc, "https://api.mainnet-beta.solana.com",
                    "Default RPC URL mismatch"
                );
                assert_eq!(
                    wss, "wss://api.mainnet-beta.solana.com",
                    "Default WSS URL mismatch"
                );
            }
            _ => panic!("Expected Cluster::Custom, got {:?}", cluster),
        }
    }

    // Tests for anchor_client_setup
    #[test]
    fn test_anchor_client_setup_custom_url() {
        let payer = Arc::new(Keypair::new());
        let custom_rpc_url = Some("https://custom.rpc.url".to_string());
        let result = anchor_client_setup(custom_rpc_url, payer.clone());
        assert!(
            &result.is_ok(),
            "test_anchor_client_setup_custom_url Expected Ok, got error"
        );
        let program = result.unwrap();
        assert_eq!(
            program.id(),
            Govcontract::id(),
            "Program ID does not match expected"
        );
    }

    #[test]
    fn test_anchor_client_setup_default_url() {
        let payer = Arc::new(Keypair::new());
        let result = anchor_client_setup(None, payer.clone());
        assert!(
            result.is_ok(),
            "test_anchor_client_setup_default_url Expected Ok, got error"
        );
        let program = result.unwrap();
        assert_eq!(
            program.id(),
            Govcontract::id(),
            "Program ID does not match expected"
        );
    }
}
