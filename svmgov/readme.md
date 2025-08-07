# Solana Validator Governance CLI (`svmgov`)

`svmgov` is a command-line interface (CLI) tool designed for Solana validators to interact with the Solana Validator Governance program. It enables validators to create governance proposals, support proposals, cast votes, tally votes, and list proposals and votes directly from their local machine by interfacing with the Solana blockchain.

---
## Requirements

[![Rust](https://img.shields.io/badge/Rust-1.85%2B-black?logo=rust)](https://www.rust-lang.org/)

- **Rust**: 1.85.0 or higher (stable version only—no nightly required; edition 2024 is fully supported on stable Rust)
- Install via [rustup](https://rustup.rs/)

## Installation

To use `svmgov`, follow these steps:

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/3uild-3thos/govcontract.git
   cd govcontract/svmgov
   ```

2. **Build the Project**:
   ```sh
   cargo build --release
   ```

3. **Run the CLI**:
   ```sh
   ./target/release/svmgov
   ```

---

## Usage

`svmgov` offers a set of commands to manage governance proposals and voting. Most commands require the `--identity-keypair` flag to specify the validator’s identity keypair for signing transactions.

### Global Arguments

- `--identity-keypair <PATH>`: Path to the validator’s identity keypair JSON file (required for most commands).
- `--rpc-url <URL>`: Custom RPC URL for the Solana network (optional; defaults to `https://api.mainnet-beta.solana.com`).

### Available Commands

- `create-proposal`: Create a new governance proposal.
- `support-proposal`: Support an existing proposal to help it reach the voting threshold.
- `cast-vote`: Cast a vote on an active proposal.
- `modify-vote`: Modify an existing vote on a proposal.
- `tally-votes`: Tally votes for a proposal after the voting period ends.
- `get-proposal`: Display a specific governance proposal.
- `list-proposals`: List all governance proposals, with optional status filtering.
- `list-votes`: List votes for a specific proposal, with optional verbose details.

Run any command with `--help` for detailed usage, e.g., `svmgov create-proposal --help`.

### Typical Workflow
Here's a common sequence to get started:
1. List all proposals to find IDs: `svmgov list-proposals -r https://api.mainnet-beta.solana.com`
2. View details for a specific proposal: `svmgov get-proposal --proposal-id <ID> -r https://api.mainnet-beta.solana.com`
3. Support a proposal (if needed): `svmgov support-proposal --proposal-id <ID> -i /path/to/identity_key.json`
4. Cast or modify a vote: `svmgov cast-vote --proposal-id <ID> --for-votes 7000 --against-votes 2000 --abstain-votes 1000 -i /path/to/identity_key.json` (use `modify-vote` to update).
5. After voting ends, tally results: `svmgov tally-votes --proposal-id <ID> -i /path/to/identity_key.json`
6. List votes for verification: `svmgov list-votes --proposal-id <ID> --verbose true -r https://api.mainnet-beta.solana.com`
---

## Governance Mechanics

The Solana Validator Governance program enforces the following rules, which impact CLI usage:

- **Minimum Stake for Proposal Creation**: A validator must have at least **100,000 SOL** staked to create a proposal. If this requirement isn’t met, the `create-proposal` command will fail with a `NotEnoughStake` error.
- **Cluster Support Threshold**: A proposal requires **500 basis points (5%) of total cluster support** to activate voting. Validators contribute to this using the `support-proposal` command. The smart contract calculates and enforces this threshold.

The CLI does not perform local validation of these conditions; the smart contract handles enforcement, and the CLI relays any resulting errors.

---

## Commands in Detail

### `create-proposal`

Create a new governance proposal.

**Arguments**:
- `--seed <SEED>`: Optional unique seed for the proposal (used to derive the PDA).
- `--title <TITLE>`: Proposal title (required; max 50 characters).
- `--description <DESCRIPTION>`: Proposal description (required; must start with `https://github.com`; max 250 characters).
- `--start-epoch`: Epoch the proposal should go active.
- `--length`: Epochs the proposal should be open for.

**Requirements**:
- The validator’s identity keypair must have at least **100,000 SOL** staked. Insufficient stake results in a `NotEnoughStake` error.

**Example**:
```sh
svmgov create-proposal --title "Update Fee Structure" --description "https://github.com/repo/test-proposal" --start-epoch 820 --length 20 --identity-keypair /path/to/key.json
```

### `support-proposal`

Support an existing proposal to help it reach the 5% cluster support threshold.

**Arguments**:
- `--proposal-id <ID>`: The proposal’s ID (PDA) to support (required).

**Notes**:
- Each validator’s support contributes to the proposal’s `cluster_support_bp`. Voting activates only when this reaches **500 basis points (5%)**.

**Example**:
```sh
svmgov support-proposal --proposal-id "123" --identity-keypair /path/to/key.json
```

### `cast-vote`

Cast a vote on an active governance proposal.

**Arguments**:
- `--proposal-id <ID>`: The proposal’s ID (PDA) (required).
- `--for-votes <BASIS_POINTS>`: Basis points for ‘For’ (required).
- `--against-votes <BASIS_POINTS>`: Basis points for ‘Against’ (required).
- `--abstain-votes <BASIS_POINTS>`: Basis points for ‘Abstain’ (required).


**Example**:
```sh
svmgov cast-vote --proposal-id "123" --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --identity-keypair /path/to/key.json
```

### `modify-vote`

Modify an existing vote on a proposal.

**Arguments**:
- `--proposal-id <ID>`: The proposal’s ID (PDA) (required).
- `--for-votes <BASIS_POINTS>`: Basis points for ‘For’ (required).
- `--against-votes <BASIS_POINTS>`: Basis points for ‘Against’ (required).
- `--abstain-votes <BASIS_POINTS>`: Basis points for ‘Abstain’ (required).

**Example**:
```sh
svmgov modify-vote --proposal-id "123" --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --identity-keypair /path/to/key.json
```

### `tally-votes`

Tally votes for a proposal after its voting period ends.

**Arguments**:
- `--proposal-id <ID>`: The proposal’s ID (PDA) (required).

**Requirements**:
- The voting period must have ended. Attempting to tally earlier fails with `VotingPeriodNotEnded`.

**Example**:
```sh
svmgov tally-votes --proposal-id "123" --identity-keypair /path/to/key.json
```

### `get-proposal`

Display a specific governance proposal.

**Arguments**:
- `--proposal-id <ID>`: The proposal’s ID (PDA) (required).

**Example**:
```sh
svmgov get-proposal --proposal-id "123" --rpc-url https://api.mainnet-beta.solana.com
```

### `list-proposals`

List all governance proposals, optionally filtered by status.

**Arguments**:
- `--status <STATUS>`: Optional filter (e.g., "active").

**Example**:
```sh
svmgov list-proposals --rpc-url https://api.mainnet-beta.solana.com
```

### `list-votes`

List votes for a specific proposal, with optional verbose details.

**Arguments**:
- `--proposal-id <ID>`: The proposal’s ID (PDA) (required).
- `--verbose true`: List votes with details.

**Example**:
```sh
svmgov list-votes --proposal-id "123" --rpc-url https://api.mainnet-beta.solana.com --verbose true
```

---

## Additional Notes

- **Identity Keypair**: Must have sufficient stake and permissions for actions like creating proposals or voting.
- **Vote Allocation**: In `cast-vote`, basis points (`--for-votes`, `--against-votes`, `--abstain-votes`) must sum to 10,000 (100%). E.g., 70% ‘For’ (7000), 20% ‘Against’ (2000), 10% ‘Abstain’ (1000).


## Troubleshooting

- **Compilation fails on older Rust?** Ensure you're using Rust 1.85.0 or higher (stable). No nightly features are used in this project—do not install nightly Rust, as it may introduce unrelated issues. Update your toolchain with `rustup update stable` and set `rustup default stable`.