# Solana Governance Contract
A decentralized governance system built on the Solana blockchain.

## Overview
This repository contains a Solana program that enables a decentralized governance system. The contract allows validators to create proposals, vote on them, and tally the results.

## Features

* **Proposal creation**: Validators can create new proposals with a title, description, and voting period, with merkle proof verification for stake validation.
* **Proposal support**: Validators can show support for a proposal, which helps to activate voting with enhanced stake verification.
* **Voting**: Validators can cast votes on a proposal, with their vote weight determined by their stake, including vote override functionality for delegators.
* **Vote override**: Delegators can override their validator's vote using stake account verification and merkle proofs.
* **Merkle proof verification**: Comprehensive integration with external snapshot programs for stake verification.
* **PDA utilities**: Robust program-derived address derivation for all contract accounts.
* **Enhanced validation**: Improved error handling and input validation throughout the contract.

## Contract Structure

The contract is organized into several modules:

* `error.rs`: Defines custom error codes used throughout the contract with enhanced validation messages.
* `lib.rs`: Contains the main program logic, including functions for creating proposals, casting votes, and finalizing results.
* `merkle_helpers.rs`: Provides utilities for merkle proof verification and cross-program invocation.
* `utils.rs`: Provides utility functions, such as calculating stake weights in basis points and PDA derivation.
* `state`: Defines the data structures used to store proposal, vote, and vote override information.
* `instructions`: Contains the implementation of each instruction, including create proposal, cast vote, cast vote override, modify vote, support proposal, finalize proposal, and add merkle root.


## CLI Interface

This repository also includes a command-line interface (CLI) program, `svmgov`, which provides a convenient way to interact with the contract. The `svmgov` CLI allows validators and delegators to create proposals, cast votes, override votes, and perform other actions on the contract with a simple CLI interface. The validator/delegator identity keypair is necessary for most commands, and supports API integration for real-time stake verification.

## Usage

To use this contract, you'll need to:

1. **Build and deploy**: Build the contract using `anchor build` and deploy it to a Solana cluster.
2. **Initialize index**: Use the `initialize_index` instruction to set up the proposal index PDA.
3. **Create a proposal**: Use the `create_proposal` instruction to create a new proposal with merkle proof verification for stake validation.
4. **Support a proposal**: Use the `support_proposal` instruction to show support for a proposal with stake verification.
5. **Cast a vote**: Use the `cast_vote` instruction to cast a validator vote on a proposal.
6. **Cast vote override**: Use the `cast_vote_override` instruction for delegators to override their validator's vote.
7. **Modify vote**: Use the `modify_vote` instruction to update an existing vote.
8. **Add merkle root**: Use the `add_merkle_root` instruction to set the merkle root hash for a proposal.
9. **Finalize proposal**: Use the `finalize_proposal` instruction to determine the outcome after voting ends.

## Development

To contribute to this project, you'll need:

1. **Rust and Solana tools**: Install Rust and the Solana(agave) CLI using the official instructions.
2. **Cargo**: Use Cargo to build and manage dependencies for the contract.
3. **Anchor**: Use Anchor to generate and manage the contract's IDL files.
