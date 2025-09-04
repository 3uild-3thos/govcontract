# Solana Governance Contract
A decentralized governance system built on the Solana blockchain.

## Overview
This repository contains a Solana program that enables a decentralized governance system. The contract allows validators to create proposals, vote on them, and tally the results.

## Features

* **Proposal creation**: Validators can create new proposals with a title, description, and voting period.
* **Proposal support**: Validators can show support for a proposal, which helps to activate voting.
* **Voting**: Validators can cast votes on a proposal, with their vote weight determined by their stake.
* **Tallying**: The contract can tally the votes and determine the outcome of a proposal.

### Tally Process Design

The tally process is designed to be **permissionless** - any validator can initiate the tally operation once the voting period has ended. This design choice enables:

- **Decentralized finalization**: No single point of failure - multiple validators can compete to finalize proposals
- **Faster resolution**: Proposals can be tallied as soon as voting ends, without waiting for the original proposer
- **Censorship resistance**: No validator can prevent proposal finalization by refusing to tally
- **Network efficiency**: Distributed responsibility for proposal finalization across the validator set

This approach ensures that governance proposals are resolved in a timely manner while maintaining the decentralized nature of the system.

### Vote Tallying and Batching

The contract implements a **batching mechanism** for vote tallying to handle proposals with large numbers of votes without hitting Solana's compute limits:

#### How Batching Works
- **Flexible Batching**: The contract accepts any number of vote accounts per tally call
- **Client-Side Control**: The CLI and frontend manage batch sizes based on transaction limits
- **Progress Tracking**: Each proposal tracks how many votes have been tallied
- **No Forced Limits**: The contract doesn't enforce artificial batch size limits

#### Tallying Process
1. **Multiple Calls**: For large proposals, tallying happens across multiple transactions
2. **Vote Processing**: Each call processes all vote accounts passed to it
3. **Progress Updates**: The contract updates the `tallied_votes` counter after each batch
4. **Finalization**: Proposals are only finalized when `vote_count` reaches 0 (all votes tallied)

#### Example Usage
```rust
// Small proposal - process all votes at once
tally_votes(ctx, all_vote_accounts, true)

// Large proposal - process in batches
tally_votes(ctx, first_batch_of_votes, false)  // Don't finalize yet
tally_votes(ctx, second_batch_of_votes, false) // Continue tallying
tally_votes(ctx, final_batch_of_votes, true)   // Finalize when done
```

#### Safety Features
- **Overflow Protection**: All arithmetic operations use checked math
- **Progress Validation**: Contract ensures all votes are counted before finalization
- **Error Handling**: Clear error messages for batching failures
- **State Consistency**: Proposal state remains consistent across batch calls

This design allows the governance system to scale to proposals with thousands of votes while maintaining transaction efficiency and safety.

## Contract Structure

The contract is organized into several modules:

* `error.rs`: Defines custom error codes used throughout the contract.
* `lib.rs`: Contains the main program logic, including functions for creating proposals, casting votes, and tallying results.
* `utils.rs`: Provides utility functions, such as calculating stake weights in basis points.
* `state`: Defines the data structures used to store proposal and vote information.
* `instructions`: Contains the implementation of each instruction, including create proposal, cast vote, modify vote, support proposal, and tally votes.


## CLI Interface

This repository also includes a command-line interface (CLI) program, `svmgov`, which provides a convenient way to interact with the contract. The `svmgov` CLI allows vaildators to create proposals, cast votes, and perform other actions on the contract with a simple cli interface. The validator identity keypair is necessary for most of the commands.

## Usage

To use this contract, you'll need to:

1. **Build and deploy**: Build the contract using `anchor build` and deploy it to a Solana cluster.
2. **Create a proposal**: Use the `create_proposal` instruction to create a new proposal with a title, description, and voting period. 
3. **Support a proposal**: Use the `support_proposal` instruction to show support for a proposal.
4. **Cast a vote**: Use the `cast_vote` instruction to cast a vote on a proposal.
5. **Tally votes**: Use the `tally_votes` instruction to determine the outcome of a proposal.

## Development

To contribute to this project, you'll need:

1. **Rust and Solana tools**: Install Rust and the Solana(agave) CLI using the official instructions.
2. **Cargo**: Use Cargo to build and manage dependencies for the contract.
3. **Anchor**: Use Anchor to generate and manage the contract's IDL files.
