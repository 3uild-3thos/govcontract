use anchor_lang::prelude::*;
use anchor_lang::solana_program::vote::{program as vote_program, state::VoteState};

use crate::{
    error::GovernanceError,
    state::{Proposal, Vote},
};

#[derive(Accounts)]
#[instruction(for_votes_bp: u64, against_votes_bp: u64, abstain_votes_bp: u64)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK:
    pub validator: AccountInfo<'info>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID,
        constraint = spl_vote_account.data_len() >= VoteState::size_of()
    )]
    pub spl_vote_account: AccountInfo<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), validator.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

impl<'info> CastVote<'info> {
    pub fn cast_vote(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        bumps: &CastVoteBumps,
    ) -> Result<()> {
        // Check that the proposal is open for voting
        require!(self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // 4 bytes discriminant, 32 bytes node_pubkey
        let node_pubkey = Pubkey::try_from(&self.spl_vote_account.data.borrow()[4..36])
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        // Validator identity must be part of the Vote account
        require_keys_eq!(
            node_pubkey,
            self.spl_vote_account.key(),
            GovernanceError::InvalidVoteAccount
        );

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;
        require!(
            self.proposal.start_epoch <= current_epoch,
            GovernanceError::VotingNotStarted
        );

        // Validate that the basis points sum to 10,000 (100%)
        let total_bp = for_votes_bp
            .checked_add(against_votes_bp)
            .and_then(|sum| sum.checked_add(abstain_votes_bp))
            .ok_or(ProgramError::ArithmeticOverflow)?;
        require!(total_bp == 10_000, GovernanceError::InvalidVoteDistribution);

        // Store the vote distribution in the Vote PDA
        self.vote.set_inner(Vote {
            validator: self.validator.key(),
            proposal: self.proposal.key(),
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            vote_timestamp: Clock::get()?.unix_timestamp,
            bump: bumps.vote,
        });

        Ok(())
    }
}
