// https://github.com/exo-tech-xyz/gov-v1/blob/main/programs/gov-v1/src/state/proof.rs
#![allow(clippy::too_many_arguments)]

use anchor_lang::prelude::*;

use crate::state::MetaMerkleLeaf;

#[account]
#[derive(Debug)]
pub struct MetaMerkleProof {
    pub payer: Pubkey,
    pub consensus_result: Pubkey,
    pub meta_merkle_leaf: MetaMerkleLeaf,
    pub meta_merkle_proof: Vec<[u8; 32]>,
    pub close_timestamp: i64,
}

impl MetaMerkleProof {
    pub fn init_space(meta_merkle_proof: &[[u8; 32]]) -> usize {
        8 +  // discriminator
        32 + // payer
        32 + // consensus_result
        MetaMerkleLeaf::INIT_SPACE +
        4 + (32 * meta_merkle_proof.len()) + // vec len + data
        8 // close_timestamp
    }
}
