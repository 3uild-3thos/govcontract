use anchor_lang::prelude::*;

use crate::{
    error::GovernanceError,
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

        // Mark the proposal as finalized
        self.proposal.finalized = true;

        Ok(())
    }
}
