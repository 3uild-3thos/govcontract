use anchor_lang::prelude::*;

use crate::{
    error::GovernanceError,
    events::ProposalFinalized,
    state::Proposal,
};

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Anyone can finalize after voting period ends
    #[account(
        mut,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
        constraint = !proposal.voting @ GovernanceError::ProposalClosed
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> FinalizeProposal<'info> {
    pub fn finalize_proposal(&mut self) -> Result<()> {
        // Check if the voting period has ended
        let clock = Clock::get()?;
        require!(
            clock.epoch >= self.proposal.end_epoch,
            GovernanceError::VotingPeriodNotEnded
        );

        // Emit proposal finalized event
        emit!(ProposalFinalized {
            proposal_id: self.proposal.key(),
            finalizer: self.signer.key(),
            total_for_votes: self.proposal.for_votes_lamports,
            total_against_votes: self.proposal.against_votes_lamports,
            total_abstain_votes: self.proposal.abstain_votes_lamports,
            total_votes_count: self.proposal.vote_count,
            finalization_timestamp: clock.unix_timestamp,
        });

        // Mark the proposal as finalized
        self.proposal.finalized = true;

        Ok(())
    }
}
