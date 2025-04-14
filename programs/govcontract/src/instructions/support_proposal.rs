use anchor_lang::prelude::*;

use crate::{
    error::GovernanceError,
    stake_weight_bp,
    state::{Proposal, Support},
};

#[derive(Accounts)]
pub struct SupportProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = 8 + Support::INIT_SPACE,
        seeds = [b"support", proposal.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub support: Account<'info, Support>,
    pub system_program: Program<'info, System>,
}

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(&mut self, bumps: &SupportProposalBumps) -> Result<()> {
        require!(!self.proposal.closed, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Get cluster stake
        let cluster_stake = 380_000_000u64; // Hardcoded example

        // Get supporter stake
        let supporter_stake = 50_000u64; // Hardcoded example

        // Maybe ensure the supporter has some stake
        require!(supporter_stake > 0, GovernanceError::NotEnoughStake);

        // Calculate the stake weight of this supporter in basis points
        let supporter_weight_bp = stake_weight_bp!(supporter_stake, cluster_stake)?;

        // Add the supporter's stake weight to the proposal's cluster support
        self.proposal.cluster_support_bp = self
            .proposal
            .cluster_support_bp
            .checked_add(supporter_weight_bp)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        // Check if cluster support reaches 5% (500 basis points)
        if self.proposal.cluster_support_bp >= 500 {
            // Set proposal.closed to false, indicating it’s active and can be voted on
            self.proposal.closed = false;
        }
        Ok(())
    }
}
