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
    pub fn add_merkle_root(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            self.proposal.voting == false && self.proposal.finalized == false,
            GovernanceError::CannotModifyAfterStart
        );

        let consensus_result_data = self.consensus_result.try_borrow_data()?;
        let consensus_result = ConsensusResult::try_deserialize(&mut &consensus_result_data[..])?;

        require!(
            consensus_result
                .ballot
                .meta_merkle_root
                .iter()
                .any(|&x| x != 0),
            GovernanceError::InvalidMerkleRoot
        );

        self.proposal.ballot_id = Some(consensus_result.ballot_id);
        self.proposal.merkle_root_hash = Some(consensus_result.ballot.meta_merkle_root);

        emit!(MerkleRootAdded {
            proposal_id: self.proposal.key(),
            merkle_root_hash: consensus_result.ballot.meta_merkle_root,
        });

        Ok(())
    }
}
