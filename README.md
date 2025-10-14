# Solana Validator Governance System

A decentralized governance platform for Solana validators featuring merkle proof verification, stake-weighted voting, and real-time event monitoring.

## Components

### Smart Contract
Core governance logic written in Rust using Anchor framework.

- Proposal creation with merkle proof verification
- Stake-weighted voting (For, Against, Abstain)
- Vote override functionality for delegators
- Real-time event emission for all actions
- Comprehensive error handling and validation

[Contract Documentation](./contract/readme.md)

### CLI (svmgov)
Command-line interface for validator governance interactions.

- Create and support proposals
- Cast validator votes and delegator overrides
- API integration for stake data
- Proposal finalization
- List proposals and votes

[CLI Documentation](./svmgov/readme.md)

### Frontend
Web interface for monitoring governance proposals.

- View active proposals and voting status
- Real-time results visualization
- Read-only interface
- User-friendly monitoring

[Frontend Documentation](./frontend/README.md)