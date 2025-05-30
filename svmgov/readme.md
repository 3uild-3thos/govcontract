# Solana Validator Governance CLI (svmgov)
`svmgov` is a command-line tool for interacting with the Solana Validator Governance program. It enables validators to create governance proposals, support proposals, cast votes, tally votes, and list proposals and votes—all from their local machine by communicating with the Solana blockchain.

---

## Installation
To get started with svmgov, follow these steps:
Prerequisites: Ensure you have Rust installed on your system.
Clone the Repository:
```sh
git clone https://github.com/your-repo/svmgov.git
cd svmgov
```

Build the Project:
```sh
cargo build --release
```
Run the CLI:
```sh
./target/release/svmgov
```

### Usage
svmgov provides a set of commands to manage governance proposals and voting on the Solana blockchain:

**create-proposal**: Create a new governance proposal.

**support-proposal**: Support an existing proposal to make it available for voting.

**cast-vote**: Cast a vote on a live proposal.

**tally-votes**: Tally the votes for a specified proposal.

**list-proposals**: List all governance proposals, with optional status filtering.

**list-votes**: List all votes for a specified proposal, with optional status filtering.

Run any subcommand with the --help flag for detailed usage information, e.g., svmgov create-proposal --help.

### Global Arguments
These arguments can be used with any command:
```sh
--identity_keypair <PATH>: Path to the identity keypair JSON file (required for most commands).
--rpc_url <URL>: Custom RPC URL to connect to the Solana network (optional; defaults to https://api.mainnet-beta.solana.com).
``` 

### Commands
**create-proposal**
Create a new governance proposal.

Arguments:
```sh
--seed <SEED>: Optional unique seed for the proposal (used to derive the PDA).

--title <TITLE>: Title of the proposal (required).

--description <DESCRIPTION>: Description of the proposal (required).
```
Example:
```sh
svmgov create-proposal --title "New Governance Rule" --description "This proposal suggests a new rule." --identity_keypair /path/to/key.json
```

**support-proposal**

Support an existing proposal to make it available for voting.

Arguments:
```sh
--proposal_id <ID>: The ID of the proposal to support (required).
```
Example:
```sh
svmgov support-proposal --proposal_id "123" --identity_keypair /path/to/key.json
```

**cast-vote**

Cast a vote on a live proposal. Votes are allocated using basis points for 'For', 'Against', and 'Abstain', which must sum to 10,000 (representing 100% of the voter’s stake).

Arguments:
```sh
--proposal_id <ID>: The ID of the proposal to vote on (required).

--for_votes <BASIS_POINTS>: Basis points for 'For' (required).

--against_votes <BASIS_POINTS>: Basis points for 'Against' (required).

--abstain_votes <BASIS_POINTS>: Basis points for 'Abstain' (required).
```
Example:
```sh
svmgov cast-vote --proposal_id 123 --for_votes 6000 --against_votes 3000 --abstain_votes 1000 --identity_keypair /path/to/key.json
```

**tally-votes**

Tally the votes for a specified proposal. Only the author of the proposal can start the tally process.

Arguments:
```sh
--proposal_id <ID>: The ID of the proposal to tally (required).
```
Example:
```sh
svmgov tally-votes --proposal_id "123" --identity_keypair /path/to/key.json
```

**list-proposals**

List all governance proposals, optionally filtered by status.

Arguments:
```sh
--status <STATUS>: Optional filter for proposal status (e.g., "active").
```
Example:

```sh
svmgov list-proposals --rpc_url https://api.mainnet-beta.solana.com
```
**list-votes**

List all votes for a specified proposal, optionally filtered by status.

Arguments:
```sh
--proposal_id <ID>: The ID of the proposal (required).

--status <STATUS>: Optional filter for vote status (e.g., "active").
```
Example:

```sh
svmgov list-votes --proposal_id "123" --rpc_url https://api.mainnet-beta.solana.com
```

### Notes

**Identity Keypair**: Ensure the provided keypair has the necessary permissions and funds to perform actions like creating proposals or casting votes.

**Vote Allocation**: For the cast-vote subcommand, the basis points (--for_votes, --against_votes, --abstain_votes) must sum to 10,000. For example, 60% 'For' (6000), 30% 'Against' (3000), and 10% 'Abstain' (1000).

