use anchor_lang::prelude::*;

use crate::{
    error::GovernanceError,
    state::Proposal,
};

#[derive(Accounts)]
pub struct AddMerkleRoot<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Must be the original proposal author

    #[account(
        mut,
        constraint = proposal.author == signer.key() @ GovernanceError::UnauthorizedMerkleRootUpdate,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
        constraint = proposal.merkle_root_hash.is_some() @ GovernanceError::MerkleRootAlreadySet
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

impl<'info> AddMerkleRoot<'info> {
    pub fn add_merkle_root(
        &mut self,
        merkle_root_hash: [u8; 32],
    ) -> Result<()> {
        // Additional validation - ensure merkle root is not all zeros
        require!(
            merkle_root_hash.iter().any(|&x| x != 0),
            GovernanceError::InvalidMerkleRoot
        );

        // Set the merkle root hash
        self.proposal.merkle_root_hash = Some(merkle_root_hash);

        Ok(())
    }
}
