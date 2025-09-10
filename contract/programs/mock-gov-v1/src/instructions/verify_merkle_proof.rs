use crate::state::{ConsensusResult, MetaMerkleProof, StakeMerkleLeaf};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct VerifyMerkleProof<'info> {
    #[account(has_one = consensus_result)]
    pub meta_merkle_proof: Box<Account<'info, MetaMerkleProof>>,
    pub consensus_result: Box<Account<'info, ConsensusResult>>,
}

impl<'info> VerifyMerkleProof<'info> {
    pub fn verify_merkle_proof(
        &mut self,
        _stake_proof: Option<Vec<[u8; 32]>>,
        _stake_leaf: Option<StakeMerkleLeaf>,
    ) -> Result<()> {
        // No calculations for mock-gov-v1
        Ok(())
    }
}
