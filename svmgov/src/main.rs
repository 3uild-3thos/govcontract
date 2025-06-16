use anchor_client::anchor_lang::declare_program;
use anchor_lang::prelude::Pubkey;
use anyhow::Result;
use clap::{Parser, Subcommand};
use env_logger;
mod instructions;
mod utils;
use utils::{commands, utils::*};

declare_program!(govcontract);

#[derive(Parser)]
#[command(
    name = "svmgov",
    version,
    about = "A simple CLI to help creating and voting on validator governance proposals.",
    long_about = "svmgov is a command-line tool for interacting with the Solana Validator Governance program. \
                    It allows users to create proposals, support proposals, cast votes, tally votes, and list proposals and votes.\n\n\
                    To get started, use one of the subcommands below. For example, to list all proposals:\n\
                    $ svmgov list-proposals --rpc_url https://api.mainnet-beta.solana.com\n\n\
                    For more information on each subcommand, use --help, e.g., `svmgov create-proposal --help`."
)]
struct Cli {
    /// Path to the identity keypair JSON file.
    /// This argument is global, meaning it can be used with any subcommand.
    #[arg(
        short,
        long,
        help = "Path to the identity keypair JSON file",
        global = true
    )]
    identity_keypair: Option<String>,

    /// Custom rpc url. This argument is also global and can be used with any subcommand.
    #[arg(short, long, help = "Custom rpc url", global = true)]
    rpc_url: Option<String>,

    /// ONLY FOR TESTING
    #[arg(short, long, help = "Validator key for testing only", global = true)]
    validator: Pubkey,

    /// Subcommands for the CLI
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    #[command(
        about = "Create a proposal to vote on",
        long_about = "This command creates a new governance proposal with the help of the Solana Validator Governance program. \
                      It requires a title and a GitHub link for the proposal description, and optionally a unique seed to derive the proposal's address (PDA). \
                      The identity keypair is required to sign the transaction, and an optional RPC URL can be provided to connect to the chain.\n\n\
                      Examples:\n\
                      $ svmgov create-proposal --title \"New Governance Rule\" --description \"https://github.com/repo/proposal\" --start_epoch 820 --length 20 --identity_keypair /path/to/key.json\n\
                      $ svmgov create-proposal --seed 42 --title \"New Governance Rule\" --description \"https://github.com/repo/proposal\" --identity_keypair /path/to/key.json --rpc_url https://api.mainnet-beta.solana.com"
    )]
    CreateProposal {
        /// Optional unique seed for the proposal (used to derive the PDA).
        #[arg(long, help = "Unique seed for the proposal (optional)")]
        seed: Option<u64>,

        /// Title of the proposal.
        #[arg(long, help = "Proposal title")]
        title: String,

        /// GitHub link for the proposal description.
        #[arg(long, help = "GitHub link for the proposal description")]
        description: String,

        /// Start epoch of proposal.
        #[arg(long, help = "The start epoch for the proposal")]
        start_epoch: u64,

        /// Length in epochs for the proposal to go active for support and eventually voting.
        #[arg(
            long,
            help = "The length of the voting period for the proposal in epochs"
        )]
        length: u64,
    },

    #[command(
        about = "Support a proposal to vote on",
        long_about = "This command allows an eligible validator to support a governance proposal, making it available for voting. \
                      It requires the proposal ID and the validator's identity keypair to sign the transaction. \
                      An optional RPC URL can be provided to connect to the chain.\n\n\
                      Example:\n\
                      $ svmgov support-proposal --proposal_id \"123\" --identity_keypair /path/to/key.json --rpc_url https://api.mainnet-beta.solana.com"
    )]
    SupportProposal {
        #[arg(long, help = "Proposal ID")]
        proposal_id: String,
    },

    #[command(
        about = "Cast a vote on a proposal",
        long_about = "This command casts a vote on a live governance proposal. \
                      Voters specify how to allocate their stake weight across 'For', 'Against', and 'Abstain' using basis points, which must sum to 10,000 (representing 100% of their stake). \
                      It requires the proposal ID and the identity keypair to sign the vote. An optional RPC URL can be provided to connect to the chain.\n\n\
                      Example:\n\
                      $ svmgov cast-vote --proposal_id 123 --for_votes 6000 --against_votes 3000 --abstain_votes 1000 --identity_keypair /path/to/key.json --rpc_url https://api.mainnet-beta.solana.com"
    )]
    /// Voters submit their votes via the smart contract, specifying how they allocate their
    /// stake weight across the three options. For example, a voter with 100 SOL might assign
    /// 6,000 basis points (60%) to "for," 3,000 (30%) to "against," and 1,000 (10%) to "abstain."
    /// Each voter’s allocation must sum to 10,000 basis points (100% of their stake).
    /// svmgov cast-vote --proposal-id "123" --for_votes 6000 --against_votes 3000 --abstain_votes 1000 --identity_keypair_path /path/to/key.json
    CastVote {
        /// Proposal ID for which the vote is being cast (proposal Pubkey).
        #[arg(long, help = "Proposal ID")]
        proposal_id: String,

        /// Basis points for 'For' vote.
        #[arg(long, help = "Basis points for 'For'")]
        for_votes: u64,

        /// Basis points for 'Against' vote.
        #[arg(long, help = "Basis points for 'Against'")]
        against_votes: u64,

        /// Basis points for 'Abstain' vote.
        #[arg(long, help = "Basis points for 'Abstain'")]
        abstain_votes: u64,
    },

    ModifyVote {
        /// Proposal ID for which the vote is being modified (proposal Pubkey).
        #[arg(long, help = "Proposal ID")]
        proposal_id: String,

        /// Basis points for 'For' vote.
        #[arg(long, help = "Basis points for 'For'")]
        for_votes: u64,

        /// Basis points for 'Against' vote.
        #[arg(long, help = "Basis points for 'Against'")]
        against_votes: u64,

        /// Basis points for 'Abstain' vote.
        #[arg(long, help = "Basis points for 'Abstain'")]
        abstain_votes: u64,
    },

    #[command(
        about = "Tally votes for a specified proposal",
        long_about = "This command sends a transaction to tally all votes cast on a specified governance proposal, providing a summary of the voting results. \
                      It requires the proposal ID and the identity keypair to interact with the chain. \
                      An optional RPC URL can be provided to connect to the chain. \
                      Ensure the proposal is in a state where tallying is possible (e.g., voting has ended).\n\n\
                      Example:\n\
                      $ svmgov tally-votes --proposal_id \"123\" --identity_keypair /path/to/key.json --rpc_url https://api.mainnet-beta.solana.com"
    )]
    TallyVotes {
        /// Proposal ID to tally.
        #[arg(long, help = "Proposal ID")]
        proposal_id: String,
    },

    #[command(
        about = "Display a proposal",
        long_about = "This command retrieves and displays a governance proposal from the Solana Validator Governance program. \
                      An optional RPC URL can be provided to connect to the chain; otherwise, a default URL is used.\n\n\
                      Examples:\n\
                      $ svmgov get-proposal --proposal_id \"123\" --rpc_url https://api.mainnet-beta.solana.com"
    )]
    GetProposal {
        /// Proposal id to display.
        #[arg(long, help = "Proposal ID")]
        proposal_id: String,
    },

    #[command(
        about = "List all governance proposals",
        long_about = "This command retrieves and displays a list of all governance proposals from the Solana Validator Governance program. \
                      You can optionally filter proposals by their status (e.g., 'active') using the --status flag. \
                      An optional RPC URL can be provided to connect to the chain; otherwise, a default URL is used.\n\n\
                      Examples:\n\
                      $ svmgov list-proposals --rpc_url https://api.mainnet-beta.solana.com\n\
                      $ svmgov list-proposals --status \"active\" --rpc_url https://api.mainnet-beta.solana.com"
    )]
    ListProposals {
        /// Filter on status of the proposals <active>.
        #[arg(long, help = "Status of proposal")]
        status: Option<String>,
    },

    #[command(
        about = "List all votes for a specified proposal",
        long_about = "This command retrieves and displays all votes cast on a specified governance proposal. \
                      It requires the proposal ID, and use the --verbose flag for detailed outout. \
                      An optional RPC URL can be provided to connect to the chain; otherwise, a default URL is used.\n\n\
                      Examples:\n\
                      $ svmgov list-votes --proposal_id \"123\" --rpc_url https://api.mainnet-beta.solana.com\n
                      $ svmgov list-votes --proposal_id \"123\" --verbose true"
    )]
    ListVotes {
        /// Proposal id to get votes for.
        #[arg(long, help = "Proposal ID")]
        proposal_id: String,
        /// Verbose vote list
        #[arg(long, help = "List votes verbose", default_value_t = false)]
        verbose: bool,
    },
}

async fn handle_command(cli: Cli) -> Result<()> {
    match &cli.command {
        Commands::CreateProposal {
            seed,
            title,
            description,
            start_epoch,
            length,
        } => {
            instructions::create_proposal(
                title.to_string(),
                description.to_string(),
                *seed,
                cli.identity_keypair,
                cli.rpc_url,
                *start_epoch,
                *length,
                cli.validator,
            )
            .await?;
        }

        Commands::SupportProposal { proposal_id } => {
            instructions::support_proposal(
                proposal_id.to_string(),
                cli.identity_keypair,
                cli.rpc_url,
                cli.validator,
            )
            .await?;
        }

        Commands::CastVote {
            proposal_id,
            for_votes,
            against_votes,
            abstain_votes,
        } => {
            instructions::cast_vote(
                proposal_id.to_string(),
                *for_votes,
                *against_votes,
                *abstain_votes,
                cli.identity_keypair,
                cli.rpc_url,
                // cli.validator,
            )
            .await?;
        }

        Commands::ModifyVote {
            proposal_id,
            for_votes,
            against_votes,
            abstain_votes,
        } => {
            instructions::modify_vote(
                proposal_id.to_string(),
                *for_votes,
                *against_votes,
                *abstain_votes,
                cli.identity_keypair,
                cli.rpc_url,
                cli.validator,
            )
            .await?;
        }

        Commands::TallyVotes { proposal_id } => {
            instructions::tally_votes(
                proposal_id.to_string(),
                cli.identity_keypair,
                cli.rpc_url,
                cli.validator,
            )
            .await?;
        }

        Commands::ListProposals { status } => {
            commands::list_proposals(cli.rpc_url, status.clone()).await?;
        }

        Commands::GetProposal { proposal_id } => {
            commands::get_proposal(cli.rpc_url, proposal_id).await?;
        }

        Commands::ListVotes {
            proposal_id,
            verbose,
        } => {
            commands::list_votes(cli.rpc_url, proposal_id, *verbose).await?;
        }
    }

    Ok(())
}

fn main() -> Result<()> {
    // env_logger::init();
    env_logger::builder()
        .filter_level(log::LevelFilter::Info)
        .init();
    let cli = Cli::parse();

    tokio::runtime::Runtime::new()?.block_on(handle_command(cli))?;

    Ok(())
}
