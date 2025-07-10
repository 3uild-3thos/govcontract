use anchor_lang::prelude::*;
use anchor_lang::solana_program::epoch_stake::{
    get_epoch_stake_for_vote_account, get_epoch_total_stake,
};
use anchor_lang::solana_program::vote::{program as vote_program, state::VoteState};

use crate::{
    error::GovernanceError,
    stake_weight_bp,
    state::{Proposal, Support},
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
        seeds = [b"support", proposal.key().as_ref(), signer.key().as_ref()],
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

        let version = u32::from_le_bytes(
            vote_account_data[0..4]
                .try_into()
                .map_err(|_| GovernanceError::InvalidVoteAccountVersion)?,
        );

        require!(version <= 2, GovernanceError::InvalidVoteAccount);

        // 4 bytes discriminant, 32 bytes node_pubkey
        let node_pubkey = Pubkey::try_from(&vote_account_data[4..36])
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

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

        // Calculate the stake weight of this supporter in basis points
        let supporter_weight_bp = stake_weight_bp!(supporter_stake as u128, cluster_stake as u128)?;

        // Add the supporter's stake weight to the proposal's cluster support
        self.proposal.cluster_support_bp = self
            .proposal
            .cluster_support_bp
            .checked_add(TryInto::<u64>::try_into(supporter_weight_bp)?)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        // Check if cluster support reaches 5% (500 basis points)
        if self.proposal.cluster_support_bp >= 500 {
            // Set proposal.voting to true, indicating it’s active and can be voted on
            self.proposal.voting = true;
        }
        Ok(())
    }
}
