# Solana Validator Governance CLI (`svmgov`)

`svmgov` is a command-line interface (CLI) tool designed for Solana validators and delegators to interact with the Solana Validator Governance program. It enables validators to create governance proposals, support proposals, cast votes, and manage vote overrides with merkle proof verification. Delegators can override their validator's votes using stake account verification. The CLI integrates with external APIs for real-time validator stake data and supports comprehensive governance operations.

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

- `--identity-keypair <PATH>` (short: `-i`; env: `SVMGOV_KEY`): Path to the validator’s identity keypair JSON file (required for most commands).
- `--rpc-url <URL>` (short: `-r`; env: `SVMGOV_RPC`): Custom RPC URL for the Solana network (optional; defaults to `https://api.mainnet-beta.solana.com`).

Example env usage: Set `export SVMGOV_KEY="/path/to/key.json"` and `export SVMGOV_RPC="https://api.testnet.solana.com"`, then run commands without these flags (e.g., `svmgov list-proposals` uses the env values).

### Available Commands

- `init-index`: Initialize the proposal index PDA (one-time setup).
- `create-proposal`: Create a new governance proposal with merkle proof verification.
- `support-proposal`: Support an existing proposal with stake verification.
- `cast-vote`: Cast a validator vote on an active proposal.
- `cast-vote-override`: Override validator vote as a delegator (requires stake account).
- `modify-vote`: Modify an existing vote on a proposal.
- `modify-vote-override`: Modify an existing vote override on a proposal (for delegators).
- `add-merkle-root`: Add merkle root hash to a proposal for verification.
- `finalize-proposal`: Finalize a proposal after voting period ends.
- `get-proposal`: Display a specific governance proposal.
- `list-proposals`: List all governance proposals, with optional status filtering.
- `list-votes`: List votes for a specific proposal, with optional verbose details.

Run any command with `--help` for detailed usage, e.g., `svmgov create-proposal --help`.

### Typical Workflow

Here's a common sequence to get started:

1. **Initialize index** (one-time): `svmgov init-index -i /path/to/identity_key.json`
2. **List proposals** to find IDs: `svmgov list-proposals -r https://api.mainnet-beta.solana.com`
3. **View proposal details**: `svmgov get-proposal --proposal-id <ID> -r https://api.mainnet-beta.solana.com`
4. **Create a proposal** (validators): `svmgov create-proposal --title "Proposal Title" --description "https://github.com/repo/issue" --ballot-id <ID> --snapshot-slot <SLOT> --network <NETWORK> -i /path/to/identity_key.json`
5. **Support a proposal** (validators): `svmgov support-proposal --proposal-id <ID> --ballot-id <ID> --snapshot-slot <SLOT> --network <NETWORK> -i /path/to/identity_key.json`
6. **Cast validator vote**: `svmgov cast-vote --proposal-id <ID> --ballot-id <ID> --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --snapshot-slot <SLOT> --network <NETWORK> -i /path/to/identity_key.json`
7. **Cast vote override** (delegators): `svmgov cast-vote-override --proposal-id <ID> --ballot-id <ID> --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --snapshot-slot <SLOT> --network <NETWORK> -i /path/to/identity_key.json`
8. **Modify vote** (if needed): `svmgov modify-vote --proposal-id <ID> --ballot-id <ID> --for-votes 8000 --against-votes 1000 --abstain-votes 1000 --snapshot-slot <SLOT> --network <NETWORK> -i /path/to/identity_key.json`
9. **Modify vote override** (delegators, if needed): `svmgov modify-vote-override --proposal-id <ID> --ballot-id <ID> --for-votes 8000 --against-votes 1000 --abstain-votes 1000 --snapshot-slot <SLOT> --network <NETWORK> -i /path/to/identity_key.json`
10. **Add merkle root** (proposal author): `svmgov add-merkle-root --proposal-id <ID> --merkle-root <HASH> -i /path/to/identity_key.json`
11. **Finalize proposal** after voting ends: `svmgov finalize-proposal --proposal-id <ID> -i /path/to/identity_key.json`
12. **List votes** for verification: `svmgov list-votes --proposal-id <ID> --verbose -r https://api.mainnet-beta.solana.com`

---

## Governance Mechanics

The Solana Validator Governance program enforces the following rules, which impact CLI usage:

- **Minimum Stake for Proposal Creation**: A validator must have at least **100,000 SOL** staked to create a proposal. If this requirement isn't met, the `create-proposal` command will fail with a `NotEnoughStake` error.
- **Cluster Support Threshold**: A proposal requires **500 basis points (5%) of total cluster support** to activate voting. Validators contribute to this using the `support-proposal` command. The smart contract calculates and enforces this threshold.
- **Merkle Proof Verification**: All stake-related operations use merkle proof verification to ensure stake ownership and prevent double-voting. The CLI integrates with external APIs to fetch and verify proofs.
- **Vote Override**: Delegators can override their validator's vote using stake account verification. This allows for more democratic participation in governance.
- **Proposal Lifecycle**: Proposals follow a lifecycle: Creation → Support Phase → Voting Phase → Finalization. Currently, proposals are created without specific epoch-based scheduling and become available for voting once they reach the cluster support threshold.

The CLI does not perform local validation of these conditions; the smart contract handles enforcement through merkle proof verification, and the CLI relays any resulting errors.

## Event Monitoring

All CLI commands that interact with the governance contract emit comprehensive events that frontend applications and external services can monitor in real-time. These events provide complete transparency into governance activities.

### Available Events

- **`ProposalCreated`** - Emitted when `create-proposal` is executed
- **`ProposalSupported`** - Emitted when `support-proposal` is executed
- **`VoteCast`** - Emitted when `cast-vote` is executed
- **`VoteOverrideCast`** - Emitted when `cast-vote-override` is executed
- **`VoteModified`** - Emitted when `modify-vote` is executed
- **`VoteOverrideModified`** - Emitted when `modify-vote-override` is executed
- **`MerkleRootAdded`** - Emitted when `add-merkle-root` is executed
- **`ProposalFinalized`** - Emitted when `finalize-proposal` is executed

### Monitoring Events

Frontend applications can listen to these events for real-time updates:

For detailed event data structures and usage examples, refer to the [Contract Events Documentation](../contract/readme.md#events).

---

## Commands in Detail

### `init-index`

Initialize the proposal index PDA (one-time setup).

**Arguments**: None required.

**Requirements**:

- Must be run once before creating any proposals to set up the index PDA.

**Example**:

```sh
svmgov init-index --identity-keypair /path/to/key.json
```

### `create-proposal`

Create a new governance proposal with merkle proof verification.

**Arguments**:

- `--seed <SEED>`: Optional unique seed for the proposal (used to derive the PDA).
- `--title <TITLE>`: Proposal title (required; max 50 characters).
- `--description <DESCRIPTION>`: Proposal description (required; must start with `https://github.com`; max 250 characters).
- `--ballot-id <ID>`: Ballot ID for consensus result PDA derivation (required).
- `--snapshot-slot <SLOT>`: Snapshot slot for fetching merkle proofs (required).
- `--network <NETWORK>`: Network for fetching merkle proofs (required).

**Requirements**:

- The validator's identity keypair must have at least **100,000 SOL** staked.
- Merkle proof verification is performed to validate stake ownership.

**Example**:

```sh
svmgov create-proposal --title "Update Fee Structure" --description "https://github.com/repo/test-proposal" --ballot-id 1 --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json
```

### `support-proposal`

Support an existing proposal with stake verification to help it reach the 5% cluster support threshold.

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) to support (required).
- `--ballot-id <ID>`: Ballot ID for consensus result PDA derivation (required).
- `--snapshot-slot <SLOT>`: Snapshot slot for fetching merkle proofs (required).
- `--network <NETWORK>`: Network for fetching merkle proofs (required).

**Notes**:

- Each validator's support contributes to the proposal's `cluster_support_bp`. Voting activates only when this reaches **500 basis points (5%)**.
- Merkle proof verification ensures stake ownership.

**Example**:

```sh
svmgov support-proposal --proposal-id "123" --ballot-id 1 --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json
```

### `cast-vote`

Cast a validator vote on an active governance proposal with merkle proof verification.

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) (required).
- `--ballot-id <ID>`: Ballot ID for consensus result PDA derivation (required).
- `--for-votes <BASIS_POINTS>`: Basis points for 'For' (required).
- `--against-votes <BASIS_POINTS>`: Basis points for 'Against' (required).
- `--abstain-votes <BASIS_POINTS>`: Basis points for 'Abstain' (required).
- `--snapshot-slot <SLOT>`: Snapshot slot for fetching merkle proofs (required).
- `--network <NETWORK>`: Network for fetching merkle proofs (required).

**Requirements**:

- Basis points must sum to 10,000 (100%).
- Merkle proof verification validates stake ownership.

**Example**:

```sh
svmgov cast-vote --proposal-id "123" --ballot-id 1 --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json
```

### `cast-vote-override`

Override a validator's vote as a delegator using stake account verification.

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) (required).
- `--ballot-id <ID>`: Ballot ID for consensus result PDA derivation (required).
- `--for-votes <BASIS_POINTS>`: Basis points for 'For' (required).
- `--against-votes <BASIS_POINTS>`: Basis points for 'Against' (required).
- `--abstain-votes <BASIS_POINTS>`: Basis points for 'Abstain' (required).
- `--stake-account <PUBKEY>`: Optional stake account pubkey (base58). If omitted, the CLI selects the first stake account from the voter summary for the signer.
- `--snapshot-slot <SLOT>`: Snapshot slot for fetching merkle proofs (required).
- `--network <NETWORK>`: Network for fetching merkle proofs (required).
- `--operator-api <URL>`: Optional operator API endpoint for snapshot data. Uses env var by default.

**Requirements**:

- Basis points must sum to 10,000 (100%).
- Requires stake account ownership and merkle proof verification.
- Can only override votes for stake accounts delegated to the caller.

**Examples**:

```sh
# Auto-select first stake account from summary
svmgov cast-vote-override --proposal-id "123" --ballot-id 1 --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json

# Use an explicit stake account
svmgov cast-vote-override --proposal-id "123" --ballot-id 1 --for-votes 7000 --against-votes 2000 --abstain-votes 1000 --stake-account <STAKE_PUBKEY> --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json
```

### `modify-vote`

Modify an existing vote on a proposal with merkle proof verification.

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) (required).
- `--ballot-id <ID>`: Ballot ID for consensus result PDA derivation (required).
- `--for-votes <BASIS_POINTS>`: Basis points for 'For' (required).
- `--against-votes <BASIS_POINTS>`: Basis points for 'Against' (required).
- `--abstain-votes <BASIS_POINTS>`: Basis points for 'Abstain' (required).
- `--snapshot-slot <SLOT>`: Snapshot slot for fetching merkle proofs (required).
- `--network <NETWORK>`: Network for fetching merkle proofs (required).

**Requirements**:

- Basis points must sum to 10,000 (100%).
- Merkle proof verification validates stake ownership.

**Example**:

```sh
svmgov modify-vote --proposal-id "123" --ballot-id 1 --for-votes 8000 --against-votes 1000 --abstain-votes 1000 --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json
```

### `modify-vote-override`

Modify an existing vote override on a proposal (for delegators).

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) (required).
- `--ballot-id <ID>`: Ballot ID for consensus result PDA derivation (required).
- `--for-votes <BASIS_POINTS>`: Basis points for 'For' (required).
- `--against-votes <BASIS_POINTS>`: Basis points for 'Against' (required).
- `--abstain-votes <BASIS_POINTS>`: Basis points for 'Abstain' (required).
- `--stake-account <PUBKEY>`: Optional stake account pubkey (base58). If omitted, the CLI selects the first stake account from the voter summary for the signer.
- `--snapshot-slot <SLOT>`: Snapshot slot for fetching merkle proofs (required).
- `--network <NETWORK>`: Network for fetching merkle proofs (required).
- `--operator-api <URL>`: Optional operator API endpoint for snapshot data. Uses env var by default.

**Requirements**:

- Basis points must sum to 10,000 (100%).
- Requires stake account ownership and merkle proof verification.
- Can only modify vote overrides for stake accounts delegated to the caller.

**Examples**:

```sh
# Auto-select first stake account from summary
svmgov modify-vote-override --proposal-id "123" --ballot-id 1 --for-votes 8000 --against-votes 1000 --abstain-votes 1000 --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json

# Use an explicit stake account
svmgov modify-vote-override --proposal-id "123" --ballot-id 1 --for-votes 8000 --against-votes 1000 --abstain-votes 1000 --stake-account <STAKE_PUBKEY> --snapshot-slot 123456 --network mainnet --identity-keypair /path/to/key.json
```

### `add-merkle-root`

Add a merkle root hash to a proposal for stake verification.

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) (required).
- `--merkle-root <HASH>`: The merkle root hash as a hex string (required). Accepts with or without `0x` prefix; must decode to exactly 32 bytes.

**Requirements**:

- Can only be called by the original proposal author.
- Merkle root hash cannot be all zeros.
- Must decode to exactly 32 bytes.

**Example**:

```sh
svmgov add-merkle-root --proposal-id "123" --merkle-root "0x1234567890abcdef..." --identity-keypair /path/to/key.json
```

### `finalize-proposal`

Finalize a proposal after its voting period has ended.

**Arguments**:

- `--proposal-id <ID>`: The proposal's ID (PDA) (required).

**Requirements**:

- The voting period must have ended.
- All votes must have been counted.

**Example**:

```sh
svmgov finalize-proposal --proposal-id "123" --identity-keypair /path/to/key.json
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
- `--limit <NUMBER>`: Limit the number of proposals listed (default: 0, meaning no limit).
- `--json`: Output in JSON format (default: false).

**Example**:

```sh
svmgov list-proposals --rpc-url https://api.mainnet-beta.solana.com --limit 5 --json
```

### `list-votes`

List votes for a specific proposal, with optional verbose details.

**Arguments**:

- `--proposal-id <ID>`: The proposal’s ID (PDA) (required).
- `--verbose`: List votes with details (default: false).
- `--limit <NUMBER>`: Limit the number of votes listed (default: 0, meaning no limit).
- `--json`: Output in JSON format (default: false).

**Example**:

```sh
svmgov list-votes --proposal-id "123" --rpc-url https://api.mainnet-beta.solana.com --verbose --limit 10 --json
```

---

## Additional Notes

- **Identity Keypair**: Must have sufficient stake and permissions for actions like creating proposals or voting. Both validators and delegators can use the CLI.
- **Vote Allocation**: In `cast-vote`, `cast-vote-override`, `modify-vote`, and `modify-vote-override`, basis points (`--for-votes`, `--against-votes`, `--abstain-votes`) must sum to 10,000 (100%). E.g., 70% 'For' (7000), 20% 'Against' (2000), 10% 'Abstain' (1000).
- **Merkle Proof Verification**: All voting operations use merkle proof verification to ensure stake ownership and prevent double-voting. Commands that require merkle proofs need `--ballot-id`, `--snapshot-slot`, and `--network` flags.
- **API Integration**: The CLI integrates with external APIs for real-time validator stake data and merkle proof generation.
- **Vote Override**: Delegators can override their validator's vote using stake account verification, providing additional governance flexibility. Both `cast-vote-override` and `modify-vote-override` support this functionality.
- **Proposal States**: Proposals go through states: Created → Supported → Voting → Finalized, with appropriate validation at each step.

## Troubleshooting

- **Compilation fails on older Rust?** Ensure you're using Rust 1.85.0 or higher (stable). No nightly features are used in this project—do not install nightly Rust, as it may introduce unrelated issues. Update your toolchain with `rustup update stable` and set `rustup default stable`.
- **Merkle proof errors?** Ensure your validator/delegator has sufficient stake and the merkle proof service is accessible.
- **Vote override fails?** Verify you own the stake account and it has active stake delegated to a validator.
