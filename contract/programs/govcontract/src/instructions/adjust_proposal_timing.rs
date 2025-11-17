use anchor_lang::prelude::*;

use crate::{error::GovernanceError, events::ProposalTimingAdjusted, state::Proposal};

#[derive(Accounts)]
pub struct AdjustProposalTiming<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal author
    #[account(
        mut,
        constraint = proposal.author == signer.key() @ GovernanceError::Unauthorized,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> AdjustProposalTiming<'info> {
    pub fn adjust_timing(
        &mut self,
        creation_timestamp: Option<i64>,
        creation_epoch: Option<u64>,
        start_epoch: Option<u64>,
        end_epoch: Option<u64>,
        snapshot_slot: Option<u64>,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // Update fields if provided
        if let Some(ts) = creation_timestamp {
            self.proposal.creation_timestamp = ts;
        }
        if let Some(epoch) = creation_epoch {
            self.proposal.creation_epoch = epoch;
        }
        if let Some(epoch) = start_epoch {
            self.proposal.start_epoch = epoch;
        }
        if let Some(epoch) = end_epoch {
            self.proposal.end_epoch = epoch;
        }
        if let Some(slot) = snapshot_slot {
            self.proposal.snapshot_slot = slot;
        }

        emit!(ProposalTimingAdjusted {
            proposal_id: self.proposal.key(),
            author: self.signer.key(),
            new_creation_timestamp: self.proposal.creation_timestamp,
            new_creation_epoch: self.proposal.creation_epoch,
            new_start_epoch: self.proposal.start_epoch,
            new_end_epoch: self.proposal.end_epoch,
            new_snapshot_slot: self.proposal.snapshot_slot,
            adjustment_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

