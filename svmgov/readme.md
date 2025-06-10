# Solana Validator Governance CLI (`svmgov`)

`svmgov` is a command-line interface (CLI) tool designed for Solana validators to interact with the Solana Validator Governance program. It enables validators to create governance proposals, support proposals, cast votes, tally votes, and list proposals and votes directly from their local machine by interfacing with the Solana blockchain.

---

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

`svmgov` offers a set of commands to manage governance proposals and voting. Most commands require the `--identity_keypair` flag to specify the validator’s identity keypair for signing transactions.

### Global Arguments

- `--identity_keypair <PATH>`: Path to the validator’s identity keypair JSON file (required for most commands).
- `--rpc_url <URL>`: Custom RPC URL for the Solana network (optional; defaults to `https://api.mainnet-beta.solana.com`).

### Available Commands

- `create-proposal`: Create a new governance proposal.
- `support-proposal`: Support an existing proposal to help it reach the voting threshold.
- `cast-vote`: Cast a vote on an active proposal.
- `tally-votes`: Tally votes for a proposal after the voting period ends.
- `list-proposals`: List all governance proposals, with optional status filtering.
- `list-votes`: List votes for a specific proposal, with optional status filtering.

Run any command with `--help` for detailed usage, e.g., `svmgov create-proposal --help`.

---

## Governance Mechanics

The Solana Validator Governance program enforces the following rules, which impact CLI usage:

- **Minimum Stake for Proposal Creation**: A validator must have at least **40,000 SOL** staked to create a proposal. If this requirement isn’t met, the `create-proposal` command will fail with a `NotEnoughStake` error.
- **Cluster Support Threshold**: A proposal requires **500 basis points (5%) of total cluster support** to activate voting. Validators contribute to this using the `support-proposal` command. The smart contract calculates and enforces this threshold.

The CLI does not perform local validation of these conditions; the smart contract handles enforcement, and the CLI relays any resulting errors.

---

## Commands in Detail

### `create-proposal`

Create a new governance proposal.

**Arguments**:
- `--seed <SEED>`: Optional unique seed for the proposal (used to derive the PDA).
- `--title <TITLE>`: Proposal title (required).
- `--description <DESCRIPTION>`: Proposal description (required).
- `--start_epoch`: Epoch the proposal should go active.
- `--length`: Epochs the proposal should be open for.

**Requirements**:
- The validator’s identity keypair must have at least **40,000 SOL** staked. Insufficient stake results in a `NotEnoughStake` error.

**Example**:
```sh
svmgov create-proposal --title "Update Fee Structure" --description "https://github.com/repo/test-proposal" --start_epoch 820 --length 20 --identity_keypair /path/to/key.json
```

### `support-proposal`

Support an existing proposal to help it reach the 5% cluster support threshold.

**Arguments**:
- `--proposal_id <ID>`: The proposal’s ID (PDA) to support (required).

**Notes**:
- Each validator’s support contributes to the proposal’s `cluster_support_bp`. Voting activates only when this reaches **500 basis points (5%)**.

**Example**:
```sh
svmgov support-proposal --proposal_id "123" --identity_keypair /path/to/key.json
```

### `cast-vote`

Cast a vote on an active governance proposal.

**Arguments**:
- `--proposal_id <ID>`: The proposal’s ID (PDA) (required).
- `--for_votes <BASIS_POINTS>`: Basis points for ‘For’ (required).
- `--against_votes <BASIS_POINTS>`: Basis points for ‘Against’ (required).
- `--abstain_votes <BASIS_POINTS>`: Basis points for ‘Abstain’ (required).


**Example**:
```sh
svmgov cast-vote --proposal_id "123" --for_votes 7000 --against_votes 2000 --abstain_votes 1000 --identity_keypair /path/to/key.json
```

### `tally-votes`

Tally votes for a proposal after its voting period ends.

**Arguments**:
- `--proposal_id <ID>`: The proposal’s ID (PDA) (required).

**Requirements**:
- The voting period must have ended. Attempting to tally earlier fails with `VotingPeriodNotEnded`.

**Example**:
```sh
svmgov tally-votes --proposal_id "123" --identity_keypair /path/to/key.json
```

### `list-proposals`

List all governance proposals, optionally filtered by status.

**Arguments**:
- `--status <STATUS>`: Optional filter (e.g., "active").

**Example**:
```sh
svmgov list-proposals --rpc_url https://api.mainnet-beta.solana.com
```

### `list-votes`

List votes for a specific proposal, optionally filtered by status.

**Arguments**:
- `--proposal_id <ID>`: The proposal’s ID (PDA) (required).
- `--status <STATUS>`: Optional filter (e.g., "active").

**Example**:
```sh
svmgov list-votes --proposal_id "123" --rpc_url https://api.mainnet-beta.solana.com
```

---

## Additional Notes

- **Identity Keypair**: Must have sufficient stake and permissions for actions like creating proposals or voting.
- **Vote Allocation**: In `cast-vote`, basis points (`--for_votes`, `--against_votes`, `--abstain_votes`) must sum to 10,000 (100%). E.g., 70% ‘For’ (7000), 20% ‘Against’ (2000), 10% ‘Abstain’ (1000).
