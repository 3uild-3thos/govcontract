#![allow(clippy::too_many_arguments)]
use crate::{
    error::GovernanceError, stake_weight_bp, state::{Proposal, ProposalIndex}, utils::is_valid_github_link
};

use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{program as vote_program, state::VoteState},
    },
};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal creator (validator)
    #[account(
        init,
        payer = signer,
        seeds = [b"proposal", seed.to_le_bytes().as_ref(), spl_vote_account.key().as_ref()],
        bump,
        space = 8 + Proposal::INIT_SPACE,
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        mut,
        seeds = [b"index"],
        bump = proposal_index.bump
    )]
    pub proposal_index: Account<'info, ProposalIndex>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        start_epoch: u64,
        voting_length_epochs: u64,
        bumps: &CreateProposalBumps,
    ) -> Result<()> {
        // Validate proposal inputs
        require!(title.len() <= 50, GovernanceError::TitleTooLong);
        require!(
            description.len() <= 250,
            GovernanceError::DescriptionTooLong
        );
        require!(
            is_valid_github_link(&description),
            GovernanceError::DescriptionInvalid
        );
        require_gt!(
            voting_length_epochs,
            0u64,
            GovernanceError::InvalidVotingLength
        );

        let clock = Clock::get()?;

        // Calculate stake weight basis points
        let cluster_stake = get_epoch_total_stake();
        let proposer_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);
        let proposer_stake_weight_bp = stake_weight_bp!(proposer_stake, cluster_stake)?;
            
        // Initialize proposal account
        self.proposal.set_inner(Proposal {
            author: self.signer.key(),
            title,
            description,
            creation_epoch: clock.epoch,
            start_epoch,
            end_epoch: start_epoch
                .checked_add(voting_length_epochs)
                .ok_or(ProgramError::ArithmeticOverflow)?,
            proposer_stake_weight_bp,
            proposal_bump: bumps.proposal,
            creation_timestamp: clock.unix_timestamp,
            index: self.proposal_index.current_index + 1,
            snapshot_slot: clock.slot,
            ..Proposal::default()
        });
        self.proposal_index.current_index += 1;

        Ok(())
    }
}
