use anchor_client::{
    Client, Cluster, Program,
    solana_sdk::{signature::Keypair, signer::Signer},
};
use anchor_lang::Id;
use anyhow::{Result, anyhow};

use std::{fs, sync::Arc};

use crate::govcontract::program::Govcontract;

// use std::fs;
// use anchor_client::solana_sdk::signature::Keypair;
// use anyhow::{Result, anyhow};
// use serde_json;

pub fn load_identity_keypair(keypair_path: Option<String>) -> Result<Keypair> {
    // Check if the keypair path is provided
    let identity_keypair_path = if let Some(path) = keypair_path {
        path
    } else {
        return Err(anyhow!(
            "No identity keypair path provided. Please specify the path using the --identity_keypair flag."
        ));
    };

    // Read the file content, handling specific errors like file not found
    let file_content = fs::read_to_string(&identity_keypair_path).map_err(|e| {
        match e.kind() {
            std::io::ErrorKind::NotFound => {
                anyhow!("The specified keypair file does not exist: {}", identity_keypair_path)
            }
            _ => anyhow!(
                "Failed to read keypair file {}: {}",
                identity_keypair_path,
                e
            ),
        }
    })?;

    // Parse the JSON content into a vector of bytes
    let keypair_bytes: Vec<u8> = serde_json::from_str(&file_content).map_err(|e| {
        anyhow!(
            "The keypair file is not a valid JSON array of bytes: {}. Error: {}",
            identity_keypair_path,
            e
        )
    })?;

    // Check if the byte array has the correct length (64 bytes for Solana keypairs)
    if keypair_bytes.len() != 64 {
        return Err(anyhow!(
            "The keypair file must contain exactly 64 bytes, but found {} bytes.",
            keypair_bytes.len()
        ));
    }

    // Create the Keypair from the bytes
    let identity_keypair = Keypair::from_bytes(&keypair_bytes).map_err(|e| {
        anyhow!(
            "The provided bytes do not form a valid Solana keypair: {}. This might be due to invalid key data.",
            e
        )
    })?;

    // Print success message with the public key
    println!(
        "Loaded identity keypair address -> {:?}",
        identity_keypair.pubkey()
    );

    Ok(identity_keypair)
}

fn set_cluster(rpc_url: Option<String>) -> Cluster {
    if let Some(rpc_url) = rpc_url {
        let wss_url = rpc_url.replace("https://", "wss://");
        Cluster::Custom(rpc_url, wss_url)
    } else {
        //
        // Cluster::Custom(
        //     "https://api.mainnet-beta.solana.com".to_string(),
        //     "wss://api.mainnet-beta.solana.com".to_string(),
        // )
        Cluster::Custom(
            "https://turbine-solanad-4cde.devnet.rpcpool.com/168dd64f-ce5e-4e19-a836-f6482ad6b396"
                .to_string(),
            "wss://turbine-solanad-4cde.devnet.rpcpool.com/168dd64f-ce5e-4e19-a836-f6482ad6b396"
                .to_string(),
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
            "Keypair path is required for creating proposal",
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
            error_msg.contains("No such file or directory")
                || error_msg.contains("Failed to read keypair file"),
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
