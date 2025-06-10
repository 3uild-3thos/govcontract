# Step-by-Step Guide for Using svmgov on Testnet

This guide provides detailed instructions for compiling, deploying, and testing the Solana Validator Governance program (`contract`) on testnet using the Anchor CLI for deployment and the `svmgov` CLI for all interactions and verification. The repository is at https://github.com/3uild-3thos/govcontract.git. It assumes Rust and Anchor are installed, and focuses on compiling the contract in the `contract` directory, deploying it to testnet, generating the IDL with the program address, and then building the CLI in the `svmgov` directory. The IDL is copied to the CLI’s `idls` directory for the Anchor client crate. All CLI commands output a Solana Explorer link for transaction verification. Proposal and vote accounts are verified using `get-proposal`, `list-proposals`, and `list-votes --verbose`. The `list-proposals` command returns only pubkeys, so `get-proposal` is used to verify proposal values.

## Prerequisites

- **Anchor**: Version compatible with `anchor-client` and `anchor-lang` v0.31.1, with the Anchor CLI installed.
- **Rust**: Latest stable version.
- **Keypair**: A funded testnet keypair JSON file, configured in Anchor’s provider (e.g., `~/.config/solana/id.json`).
- **Stake**: Control over at least 5% of testnet stake to support and pass proposals.
- **Repository**: Cloned from https://github.com/3uild-3thos/govcontract.git.
- **Anchor Configuration**: Ensure Anchor is configured for testnet in `Anchor.toml` or via `--provider.cluster testnet`.

## Step 1: Clone the Repository

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/3uild-3thos/govcontract.git
   cd govcontract
   ```

## Step 2: Compile and Deploy the Governance Contract

1. **Navigate to the Contract Directory**:

   ```bash
   cd contract
   ```

2. **Compile the Contract**:

   ```bash
   anchor build
   ```

   - **Output**: Generates the program binary (`target/deploy/govcontract.so`) and IDL (`target/idl/govcontract.json`).
   - **Verify**: Check for `target/deploy/govcontract.so` and `target/idl/govcontract.json`.

3. **Deploy the Contract to Testnet**:

   ```bash
   anchor deploy --provider.cluster testnet
   ```

   - **Output**: Deploys the program and returns the program ID (e.g., `3mkuhB2crh6BE5zg2wN5JufDXviVv2Vsia9yjC7fMiH`). The IDL (`target/idl/govcontract.json`) is updated with the deployed program ID under the `"address"` field.
   - **Verify**: Open `target/idl/govcontract.json` and confirm the `"address"` field contains the deployed program ID.
   - **Note**: Ensure your keypair (configured in Anchor’s provider) has sufficient SOL for deployment.

4. **Copy the IDL to the CLI**:

   - Copy the generated IDL to the CLI’s `idls` directory:

     ```bash
     cp target/idl/govcontract.json ../svmgov/idls/govcontract.json
     ```

   - **Purpose**: The `anchor-client` crate in the CLI requires the IDL with the correct program address in the `idls` directory to interact with the deployed program.

## Step 3: Build the CLI

1. **Navigate to the CLI Directory**:

   ```bash
   cd ../svmgov
   ```

2. **Build the CLI**:

   ```bash
   cargo build --release
   ```

   - **Output**: The CLI binary is created at `./target/release/svmgov`.
   - **Verify**: Run `./target/release/svmgov --help` to confirm the CLI displays available subcommands (`create-proposal`, `support-proposal`, `cast-vote`, `modify-vote`, `tally-votes`, `get-proposal`, `list-proposals`, `list-votes`).
   - **Note**: The CLI uses the IDL in `idls/govcontract.json`, which includes the deployed program address, ensuring compatibility with the testnet deployment.

## Step 4: Create a Proposal

1. **Run the `create-proposal` Command**:

   ```bash
   ./target/release/svmgov create-proposal \
       --title "Test Governance Proposal" \
       --description "https://github.com/repo/test-proposal" \
       --seed 12345 \
       --start_epoch 820\
       --length 20\
       --identity_keypair /path/to/keypair.json \
       --rpc_url https://api.testnet.solana.com
   ```

   - **Arguments**:
     - `--title`: Proposal title (max 50 chars, per error code 6001).
     - `--description`: GitHub link (must start with `https://github.com`, per contract validation; max 250 chars, per error code 6002).
     - `--seed`: Unique seed for PDA derivation (optional, defaults to random).
     - `--start_epoch`: Epoch the proposal should go active.
     - `--length`: Epochs the proposal should be open for.
     - `--identity_keypair`: Path to your testnet keypair with sufficient stake (>40k SOL, per error code 6000).
     - `--rpc_url`: Testnet RPC URL.
   - **Output**: Logs a Solana Explorer link (e.g., `info: Proposal created. https://explorer.solana.com/tx/<signature>`).

2. **List Proposals**:

   ```bash
   ./target/release/svmgov list-proposals --rpc_url https://api.testnet.solana.com
   ```

   - **Output**: Lists all proposal pubkeys, including the new proposal’s PDA.
   - **Verify**: Note the PDA of the new proposal for use in subsequent steps.

3. **Display the Proposal**:

   ```bash
   ./target/release/svmgov get-proposal \
       --proposal_id <PROPOSAL_PDA> \
       --rpc_url https://api.testnet.solana.com
   ```

   - **Note**: Use the `<PROPOSAL_PDA>` from the `list-proposals` output.
   - **Output**: Displays the proposal details, including PDA, title, description, and status.
   - **Expected State**:
     - `author`: Your signer pubkey.
     - `title`: "Test Governance Proposal".
     - `description`: "https://github.com/repo/test-proposal".
     - `start_epoch`: 820.
     - `end_epoch`: 840.
     - `proposer_stake_weight_bp`: Reflects your stake weight in basis points.
     - `voting`: `false` (requires support to activate).
     - `finalized`: `false`.

## Step 5: Support the Proposal

1. **Run the `support-proposal` Command**:

   ```bash
   ./target/release/svmgov support-proposal \
       --proposal_id <PROPOSAL_PDA> \
       --identity_keypair /path/to/keypair.json \
       --rpc_url https://api.testnet.solana.com
   ```

   - **Arguments**:
     - `--proposal_id`: The proposal PDA from Step 4.
     - `--identity_keypair`: Keypair with sufficient stake (>5% of testnet stake) to support the proposal.
   - **Output**: Logs a Solana Explorer link (e.g., `info: Proposal supported. https://explorer.solana.com/tx/<signature>`).
   - **Verify**:
     - Open the Solana Explorer link to confirm the transaction succeeded.
     - Refetch the proposal:
       ```bash
       ./target/release/svmgov get-proposal \
           --proposal_id <PROPOSAL_PDA> \
           --rpc_url https://api.testnet.solana.com
       ```
     - **Expected Change**: `cluster_support_bp` increases based on your stake, and `voting` may become `true` if sufficient support is reached (depends on program logic).

2. **List Proposals**:

   ```bash
   ./target/release/svmgov list-proposals --rpc_url https://api.testnet.solana.com
   ```

   - **Output**: Lists all proposal pubkeys, including the supported proposal’s PDA.
   - **Verify**: Confirm the proposal’s PDA is still present.

3. **Display the Proposal**:

   ```bash
   ./target/release/svmgov get-proposal \
       --proposal_id <PROPOSAL_PDA> \
       --rpc_url https://api.testnet.solana.com
   ```

   - **Output**: Displays the updated proposal details.
   - **Expected Change**: Confirm `cluster_support_bp` has increased and check if `voting` is `true`.

## Step 6: Cast a Vote

1. **Run the `cast-vote` Command**:

   ```bash
   ./target/release/svmgov cast-vote \
       --proposal_id <PROPOSAL_PDA> \
       --for_votes 6000 \
       --against_votes 3000 \
       --abstain_votes 1000 \
       --identity_keypair /path/to/keypair.json \
       --rpc_url https://api.testnet.solana.com
   ```

   - **Arguments**:
     - `--proposal_id`: Proposal PDA from Step 4.
     - `--for_votes`, `--against_votes`, `--abstain_votes`: Basis points summing to 10,000 (6000 + 3000 + 1000 = 10,000).
     - `--identity_keypair`: Keypair with voting stake (>5% of testnet stake).
   - **Output**: Logs a Solana Explorer link (e.g., `info: Vote cast successfully. https://explorer.solana.com/tx/<signature>`).
   - **Verify**:
     - Open the Solana Explorer link to confirm the transaction succeeded.
     - List votes to verify the vote account and deserialized data:
       ```bash
       ./target/release/svmgov list-votes \
           --proposal_id <PROPOSAL_PDA> \
           --verbose true \
           --rpc_url https://api.testnet.solana.com
       ```
       - **Output**: Displays the vote account PDA and details (e.g., `validator`, `for_votes_bp: 6000`, `against_votes_bp: 3000`, `abstain_votes_bp: 1000`, `vote_timestamp`).
       - **Expected State** (from `Vote` struct in `govcontract.json`):
         - `validator`: Your signer pubkey.
         - `proposal`: Proposal PDA.
         - `for_votes_bp`: 6000.
         - `against_votes_bp`: 3000.
         - `abstain_votes_bp`: 1000.
         - `vote_timestamp`: Current timestamp.
     - Refetch the proposal to check for updates:
       ```bash
       ./target/release/svmgov get-proposal \
           --proposal_id <PROPOSAL_PDA> \
           --rpc_url https://api.testnet.solana.com
       ```
       - **Expected Change**: `for_votes_bp`, `against_votes_bp`, and `abstain_votes_bp` may reflect the new vote, depending on program logic for vote aggregation.

## Step 7: Tally Votes

1. **Wait for Voting Period**:

   - Ensure the voting period has ended, as `tally-votes` will fail otherwise (error code 6008: `VotingPeriodNotEnded`).

2. **Run the `tally-votes` Command**:

   ```bash
   ./target/release/svmgov tally-votes \
       --proposal_id <PROPOSAL_PDA> \
       --identity_keypair /path/to/keypair.json \
       --rpc_url https://api.testnet.solana.com
   ```

   - **Arguments**:
     - `--proposal_id`: Proposal PDA from Step 4.
     - `--identity_keypair`: Keypair of the proposal author (or authorized account).
   - **Output**: Logs Solana Explorer links for each batch (e.g., `info: Tally votes: https://explorer.solana.com/tx/<signature>`) and the final proposal state (e.g., `info: Tally finished: {Proposal { ... }}`).
   - **Verify**:
     - Refetch the proposal to verify values:
       ```bash
       ./target/release/svmgov get-proposal \
           --proposal_id <PROPOSAL_PDA> \
           --rpc_url https://api.testnet.solana.com
       ```
       - **Expected State**:
         - `for_votes_bp`, `against_votes_bp`, `abstain_votes_bp`: Updated to aggregate all votes (weighted by stake).
         - `finalized`: `true` (set in the final batch).
         - `voting`: `false`.

## Step 8: Additional Testing Notes

- **Multiple Proposals**:
  - Repeat Steps 4–7 with different seeds to create and manage multiple proposals.
  - Use `list-proposals` to retrieve proposal pubkeys and `get-proposal` to verify details.

- **Modify Votes**:
  - Test the `modify-vote` command to update an existing vote:
    ```bash
    ./target/release/svmgov modify-vote \
        --proposal_id <PROPOSAL_PDA> \
        --for_votes 7000 \
        --against_votes 2000 \
        --abstain_votes 1000 \
        --identity_keypair /path/to/keypair.json \
        --rpc_url https://api.testnet.solana.com
    ```
    - **Output**: Logs a Solana Explorer link (e.g., `info: Vote modified. https://explorer.solana.com/tx/<signature>`).
    - **Verify**:
        - **Expected Change**: Vote account reflects `for_votes_bp: 7000`, `against_votes_bp: 2000`, `abstain_votes_bp: 1000`.
      - Refetch the proposal to check for updates:
        ```bash
        ./target/release/svmgov get-proposal \
            --proposal_id <PROPOSAL_PDA> \
            --rpc_url https://api.testnet.solana.com
        ```

- **Proposal Support**:
  - Test with multiple validators (keypairs) supporting the same proposal to verify `cluster_support_bp` accumulates correctly.
  - Use `list-proposals` and `get-proposal` to verify changes.
