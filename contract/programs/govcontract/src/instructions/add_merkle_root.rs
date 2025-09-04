use anchor_lang::prelude::*;

use crate::{
    error::GovernanceError,
    events::MerkleRootAdded,
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
        constraint = proposal.merkle_root_hash.is_none() @ GovernanceError::MerkleRootAlreadySet
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> AddMerkleRoot<'info> {
    pub fn add_merkle_root(
        &mut self,
        merkle_root_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            merkle_root_hash.iter().any(|&x| x != 0),
            GovernanceError::InvalidMerkleRoot
        );

        self.proposal.merkle_root_hash = Some(merkle_root_hash);

        emit!(MerkleRootAdded {
            proposal_id: self.proposal.key(),
            author: self.signer.key(),
            merkle_root_hash,
        });

        Ok(())
    }
}
