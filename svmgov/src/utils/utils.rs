use std::{collections::HashMap, fmt, fs, str::FromStr, sync::Arc, time::Duration};

use anchor_client::{
    Client, Cluster, Program,
    solana_account_decoder::UiAccountEncoding,
    solana_client::{
        nonblocking::rpc_client::RpcClient,
        rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig},
        rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    },
    solana_sdk::{
        commitment_config::{CommitmentConfig, CommitmentLevel},
        native_token::LAMPORTS_PER_SOL,
        signature::Keypair,
        signer::Signer,
        stake::{self, state::StakeStateV2},
    },
};
use anchor_lang::{AnchorDeserialize, Id, prelude::Pubkey};
use anyhow::{Result, anyhow};
use chrono::prelude::*;
use indicatif::{ProgressBar, ProgressStyle};
use textwrap::wrap;

use crate::{
    constants::*,
    gov_v1::client::{accounts as gov_v1_accounts, args as gov_v1_args},
    govcontract::{
        self,
        accounts::{Proposal, Vote},
        program::Govcontract,
    },
    utils::{
        api_helpers::{
            VoteAccountProofAPI, convert_merkle_proof_strings, derive_meta_merkle_proof_pda,
        },
        commands::validate_proposal_exists,
    },
};

/// Creates and configures a progress spinner with a custom message
pub fn create_spinner(message: &str) -> ProgressBar {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"]),
    );
    spinner.set_message(message.to_string());
    spinner.enable_steady_tick(Duration::from_millis(SPINNER_TICK_DURATION_MS));
    spinner
}

pub async fn program_setup_govcontract(
    identity_keypair: Arc<Keypair>,
    rpc_url: Option<String>,
) -> Result<Program<Arc<Keypair>>> {
    let cluster = set_cluster(rpc_url);
    let client = Client::new(cluster, identity_keypair.clone());
    let program = client.program(Govcontract::id())?;

    log::debug!(
        "program_setup_govcontract completed successfully: program_pubkey={}",
        program.id(),
    );

    Ok(program)
}

pub fn load_identity_keypair(keypair_path: Option<String>) -> Result<Arc<Keypair>> {
    // Check if the keypair path is provided
    let identity_keypair_path = if let Some(path) = keypair_path {
        path
    } else {
        return Err(anyhow!(
            "No identity keypair path provided. Please specify the path using the --identity_keypair flag."
        ));
    };

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

    Ok(Arc::new(identity_keypair))
}

pub async fn find_spl_vote_account(
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

fn set_cluster(rpc_url: Option<String>) -> Cluster {
    if let Some(rpc_url) = rpc_url {
        let wss_url = rpc_url.replace("https://", "wss://");
        Cluster::Custom(rpc_url, wss_url)
    } else {
        Cluster::Custom(DEFAULT_RPC_URL.to_string(), DEFAULT_WSS_URL.to_string())
    }
}

/// Initialize a MetaMerkleProof PDA for the gov-v1 program
/// This is required before the contract can verify merkle proofs
pub async fn ensure_meta_merkle_proof_initialized(
    proposal_id: &str,
    validator_vote_proof: &VoteAccountProofAPI,
    close_timestamp: i64,
    identity_keypair: Arc<Keypair>,
    rpc_url: Option<String>,
) -> Result<(Pubkey, Pubkey)> {
    log::debug!("Ensuring MetaMerkleProof PDA is initialized...");

    let proposal = validate_proposal_exists(proposal_id, rpc_url.clone()).await?;
    let gov_v1_program = program_setup_gov_v1(identity_keypair.clone(), rpc_url).await?;
    let consensus_result_pda = proposal
        .consensus_result_pda
        .ok_or(anyhow!("Consensus result PDA not found"))?;
    // let consensus_result_data: ConsensusResult = gov_v1_program.account::<ConsensusResult>(consensus_result_pda).await?;

    // Convert base58 proof strings to bytes
    let meta_merkle_proof_bytes =
        convert_merkle_proof_strings(&validator_vote_proof.meta_merkle_proof)?;

    let meta_merkle_proof_pda = derive_meta_merkle_proof_pda(
        &consensus_result_pda,
        &Pubkey::from_str(&validator_vote_proof.meta_merkle_leaf.vote_account)?,
    )?;

    // Check if the PDA already exists
    if gov_v1_program
        .rpc()
        .get_account(&meta_merkle_proof_pda)
        .await
        .is_ok()
    {
        log::debug!("MetaMerkleProof PDA already exists, skipping initialization");
        return Ok((consensus_result_pda, meta_merkle_proof_pda));
    }

    let spinner = create_spinner("Initializing MetaMerkleProof PDA...");

    // Call the gov-v1 program's init_meta_merkle_proof instruction
    let sig = gov_v1_program
        .request()
        .accounts(gov_v1_accounts::InitMetaMerkleProof {
            payer: identity_keypair.pubkey(),
            merkle_proof: meta_merkle_proof_pda,
            consensus_result: consensus_result_pda,
            system_program: anchor_lang::system_program::ID,
        })
        .args(gov_v1_args::InitMetaMerkleProof {
            meta_merkle_leaf: (&validator_vote_proof.meta_merkle_leaf).try_into()?,
            meta_merkle_proof: meta_merkle_proof_bytes,
            close_timestamp,
        })
        .send()
        .await?;

    log::debug!("MetaMerkleProof PDA initialized: signature={}", sig);

    spinner.finish_with_message(format!(
        "MetaMerkleProof PDA initialized. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok((consensus_result_pda, meta_merkle_proof_pda))
}

/// Setup gov_v1 program anchor client
pub async fn program_setup_gov_v1(
    identity_keypair: Arc<Keypair>,
    rpc_url: Option<String>,
) -> Result<Program<Arc<Keypair>>> {
    // Set up the cluster
    let cluster = set_cluster(rpc_url);

    // Create the Anchor client for gov-v1 program
    let client = Client::new(cluster, identity_keypair.clone());
    let program = client.program(gov_v1::ID)?;

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
            self.cluster_support_lamports / LAMPORTS_PER_SOL
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "For Votes:",
            self.for_votes_lamports,
            self.for_votes_lamports / LAMPORTS_PER_SOL
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "Against Votes:",
            self.against_votes_lamports,
            self.against_votes_lamports / LAMPORTS_PER_SOL
        )?;
        writeln!(
            f,
            "{:<25} {} lamports (~{:.2} SOL)",
            "Abstain Votes:",
            self.abstain_votes_lamports,
            self.abstain_votes_lamports / LAMPORTS_PER_SOL
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

pub fn derive_vote_pda(proposal_pubkey: &Pubkey, validator_spl_vote_pubkey: &Pubkey) -> Pubkey {
    let seeds = &[
        b"vote",
        proposal_pubkey.as_ref(),
        validator_spl_vote_pubkey.as_ref(),
    ];
    Pubkey::find_program_address(seeds, &govcontract::ID).0
}

pub fn derive_proposal_pda(seed: u64, validator_spl_vote_pubkey: &Pubkey) -> Pubkey {
    let seeds = &[
        b"proposal",
        &seed.to_le_bytes(),
        validator_spl_vote_pubkey.as_ref(),
    ];
    Pubkey::find_program_address(seeds, &govcontract::ID).0
}

pub fn derive_proposal_index_pda() -> Pubkey {
    let seeds: &[&[u8]] = &[b"index"];
    Pubkey::find_program_address(seeds, &govcontract::ID).0
}

/// Derive the support PDA for a given proposal and validator SPL vote account
pub fn derive_support_pda(proposal_pubkey: &Pubkey, validator_spl_vote_pubkey: &Pubkey) -> Pubkey {
    let seeds = &[
        b"support",
        proposal_pubkey.as_ref(),
        validator_spl_vote_pubkey.as_ref(),
    ];
    Pubkey::find_program_address(seeds, &govcontract::ID).0
}

/// Derive the vote override PDA for a given proposal, delegator stake account, and validator vote account
pub fn derive_vote_override_pda(
    proposal_pubkey: &Pubkey,
    delegator_spl_stake_account: &Pubkey,
    validator_vote_pda: &Pubkey,
) -> Pubkey {
    let seeds = &[
        b"vote_override",
        proposal_pubkey.as_ref(),
        delegator_spl_stake_account.as_ref(),
        validator_vote_pda.as_ref(),
    ];
    Pubkey::find_program_address(seeds, &govcontract::ID).0
}
