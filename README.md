## Solana Validator Governance System
The Solana Validator Governance System is a decentralized governance platform designed to facilitate validator participation in decision-making processes on the Solana blockchain. By leveraging Solana’s high performance and low latency, this system enables efficient, transparent, and secure governance for the network’s validators. This repository contains three key components:

 - Contract: The core Solana program powering the governance logic.
 - CLI (svmgov): A command-line tool for validators to interact with the governance system.
 - Frontend: A web interface for viewing proposals and their current voting status.

## Overview
This project enables Solana validators to participate in transparent and secure governance. Validators can create proposals, signal support, cast stake-weighted votes, and view outcomes—all leveraging Solana’s high-performance blockchain. The system integrates a smart contract, a CLI for performing actions, and a frontend for monitoring.

## Components
### Smart Contract
The backbone of the governance system, written in Rust using Anchor. It handles:

 - Proposal creation and support.
 - Voting with stake-weighted basis points (For, Against, Abstain).
 - Tallying and outcome determination.

Details: Check the [Contract README](../main/contract/readme.md).

## CLI (svmgov)
A Rust-based command-line interface that allows validators to manage governance actions by sending transactions to the contract. Key features include:

 - Creating and supporting proposals.
 - Casting votes and tallying results.
 - Listing proposals and votes.

Details: See the [CLI README](../main/svmgov/readme.md).

## Frontend
A web-based interface for viewing governance proposals and their current voting status. It provides a user-friendly way to monitor the governance process without the need for technical knowledge. Note: The frontend is read-only and does not support sending transactions.

Details: Explore the Frontend README.