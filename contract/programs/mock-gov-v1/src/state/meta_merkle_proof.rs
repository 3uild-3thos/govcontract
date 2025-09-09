// https://github.com/exo-tech-xyz/gov-v1/blob/main/programs/gov-v1/src/state/proof.rs
use anchor_lang::prelude::*;
use crate::state::MetaMerkleLeaf;

#[account]
#[derive(InitSpace)]
pub struct MetaMerkleProof {
    pub payer: Pubkey,
    pub consensus_result: Pubkey,
    pub meta_merkle_leaf: MetaMerkleLeaf,
    #[max_len(10)]  // Mock value for tests
    pub meta_merkle_proof: Vec<[u8; 32]>,
    pub close_timestamp: i64,
}

