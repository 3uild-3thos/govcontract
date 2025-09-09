// https://github.com/exo-tech-xyz/gov-v1/blob/main/programs/gov-v1/src/state/consensus_result.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ConsensusResult {
    pub ballot_id: u64,
    pub ballot: Ballot,
}

/// Inner struct of BallotBox
#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Default)]
pub struct Ballot {
    /// The merkle root of the meta merkle tree
    pub meta_merkle_root: [u8; 32],
    /// SHA256 hash of borsh serialized snapshot. Optional.
    pub snapshot_hash: [u8; 32],
}
