use crate::{error::GovernanceError, events::MerkleRootAdded, state::Proposal};
use anchor_lang::prelude::*;
use gov_v1::{ConsensusResult, ID as GOV_V1_ID};

#[derive(Accounts)]
pub struct AddMerkleRoot<'info> {
    #[account(
        constraint = consensus_result.owner == &GOV_V1_ID @ GovernanceError::InvalidSnapshotProgram,
    )]
    pub consensus_result: Signer<'info>,
    #[account(
        mut,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
        constraint = proposal.merkle_root_hash.is_none() @ GovernanceError::MerkleRootAlreadySet
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> AddMerkleRoot<'info> {
    pub fn add_merkle_root(&mut self, ballot_id: u64, merkle_root: [u8; 32]) -> Result<()> {
        let clock = Clock::get()?;

        require!(
            merkle_root.iter().any(|&x| x != 0),
            GovernanceError::InvalidMerkleRoot
        );

        self.proposal.ballot_id = Some(ballot_id);
        self.proposal.merkle_root_hash = Some(merkle_root);

        emit!(MerkleRootAdded {
            proposal_id: self.proposal.key(),
            merkle_root_hash: merkle_root,
        });

        Ok(())
    }
}
