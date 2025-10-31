use anchor_lang::prelude::*;

use crate::{error::GovernanceError, state::Proposal};

#[derive(Accounts)]
pub struct AdjustProposalEpochs<'info> {
    #[account(mut, constraint = signer.key() == proposal.author)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> AdjustProposalEpochs<'info> {
    pub fn adjust_proposal_epochs(&mut self, start_epoch: u64, end_epoch: u64) -> Result<()> {
        // Basic validation: end_epoch should be greater than start_epoch
        require_gt!(end_epoch, start_epoch, GovernanceError::InvalidEpochRange);

        // Update the epochs
        self.proposal.start_epoch = start_epoch;
        self.proposal.end_epoch = end_epoch;

        msg!(
            "Adjusted proposal epochs - start_epoch: {}, end_epoch: {}",
            start_epoch,
            end_epoch
        );

        Ok(())
    }
}
