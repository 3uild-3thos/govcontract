use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    error::GovernanceError,
    state::{Proposal, Support},
    utils::get_vote_state_values,
};

#[derive(Accounts)]
pub struct SupportProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: AccountInfo<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = 8 + Support::INIT_SPACE,
        seeds = [b"support", proposal.key().as_ref(), spl_vote_account.key.as_ref()],
        bump
    )]
    pub support: Account<'info, Support>,
    pub system_program: Program<'info, System>,
}

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(&mut self, bumps: &SupportProposalBumps) -> Result<()> {
        require!(!self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        let vote_account_data = &self.spl_vote_account.data.borrow();
        let (version, node_pubkey) = get_vote_state_values(vote_account_data)
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        require!(version <= 2, GovernanceError::InvalidVoteAccountVersion);

        // Validator identity must be part of the Vote account
        require_keys_eq!(
            node_pubkey,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );

        // Get cluster stake
        let cluster_stake = get_epoch_total_stake();
        require_gt!(cluster_stake, 0u64, GovernanceError::InvalidClusterStake);

        // Get supporter stake
        let supporter_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);

        // Ensure the supporter has some stake
        require!(supporter_stake > 0, GovernanceError::NotEnoughStake);

        // Add the supporter's raw stake (in lamports) to the proposal's cluster support
        self.proposal.cluster_support_lamports = self
            .proposal
            .cluster_support_lamports
            .checked_add(supporter_stake)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        // Check if cluster support reaches 5% of total cluster stake
        // Use u128 to avoid overflow: check if (cluster_support_lamports * 100) >= (cluster_stake * 5)
        let support_scaled = (self.proposal.cluster_support_lamports as u128)
            .checked_mul(100)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        let cluster_scaled = (cluster_stake as u128)
            .checked_mul(5)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        if support_scaled >= cluster_scaled {
            // Set proposal.voting to true, indicating it’s active and can be voted on
            self.proposal.voting = true;
        }
        Ok(())
    }
}