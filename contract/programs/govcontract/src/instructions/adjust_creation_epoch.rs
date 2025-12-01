use anchor_lang::prelude::*;

use crate::{error::GovernanceError, events::CreationEpochAdjusted, state::Proposal};

#[derive(Accounts)]
pub struct AdjustCreationEpoch<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal author
    #[account(
        mut,
      
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> AdjustCreationEpoch<'info> {
    pub fn adjust_creation_epoch(&mut self, new_creation_epoch: u64) -> Result<()> {
        let clock = Clock::get()?;

        // Store old value before updating
        let old_creation_epoch = self.proposal.creation_epoch;

        // Update creation epoch
        self.proposal.creation_epoch = new_creation_epoch;

        emit!(CreationEpochAdjusted {
            proposal_id: self.proposal.key(),
            author: self.signer.key(),
            old_creation_epoch,
            new_creation_epoch,
            adjustment_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

