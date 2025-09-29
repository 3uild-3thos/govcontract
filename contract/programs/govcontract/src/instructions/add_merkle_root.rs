use anchor_lang::prelude::*;
#[cfg(feature = "production")]
use gov_v1::ConsensusResult;
#[cfg(feature = "testing")]
use mock_gov_v1::ConsensusResult;

use crate::{error::GovernanceError, events::MerkleRootAdded, state::Proposal};

#[derive(Accounts)]
pub struct AddMerkleRoot<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Must be the original proposal author

    #[account(
        mut,
        constraint = proposal.author == signer.key() @ GovernanceError::UnauthorizedMerkleRootUpdate,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
        constraint = proposal.meta_merkle_root.is_none() @ GovernanceError::MerkleRootAlreadySet
    )]
    pub proposal: Account<'info, Proposal>,
    pub consensus_result: Account<'info, ConsensusResult>,
}

impl<'info> AddMerkleRoot<'info> {
    pub fn add_merkle_root(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            clock.epoch <= self.proposal.start_epoch,
            GovernanceError::CannotModifyAfterStart
        );

        // Verify merkle root is not full of 0s
        require!(
            self.consensus_result
                .ballot
                .meta_merkle_root
                .iter()
                .any(|&x| x != 0),
            GovernanceError::InvalidMerkleRoot
        );

        // Add meta merkle root and consensusresult pda to proposal
        self.proposal.meta_merkle_root = Some(self.consensus_result.ballot.meta_merkle_root);
        self.proposal.consensus_result_pda = Some(self.consensus_result.key());

        emit!(MerkleRootAdded {
            proposal_id: self.proposal.key(),
            author: self.signer.key(),
            merkle_root_hash: self.consensus_result.ballot.meta_merkle_root,
        });

        Ok(())
    }
}
