use anchor_lang::prelude::*;

use crate::{error::GovernanceError, state::Proposal};

#[derive(Accounts)]
pub struct AdjustEpochs<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        constraint = signer.key() == proposal.author @ GovernanceError::UnauthorizedMerkleRootUpdate,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
        constraint = !proposal.voting @ GovernanceError::CannotModifyAfterStart,
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> AdjustEpochs<'info> {
    pub fn adjust_epochs(
        &mut self,
        creation_epoch: Option<u64>,
        start_epoch: Option<u64>,
        end_epoch: Option<u64>,
    ) -> Result<()> {
        // Update epochs if provided
        if let Some(epoch) = creation_epoch {
            self.proposal.creation_epoch = epoch;
        }

        if let Some(epoch) = start_epoch {
            self.proposal.start_epoch = epoch;
        }

        if let Some(epoch) = end_epoch {
            self.proposal.end_epoch = epoch;
        }

        Ok(())
    }
}
