use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::get_epoch_stake_for_vote_account,
        vote::{program as vote_program, state::VoteState},
    }
};

use crate::{
    error::GovernanceError,
    state::{Proposal, Vote},
    utils::get_vote_state_values,
};

#[derive(Accounts)]
#[instruction(for_votes_bp: u64, against_votes_bp: u64, abstain_votes_bp: u64)]
pub struct CastVote<'info> {
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
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.key().as_ref()],
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

        let vote_account_data = self.spl_vote_account.data.borrow();
        let (version, node_pubkey) = get_vote_state_values(&vote_account_data)
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        require!(version <= 2, GovernanceError::InvalidVoteAccountVersion);

        // Validator identity must be part of the Vote account
        require_keys_eq!(
            node_pubkey,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );

        // Ensure the voter has some stake
        let voter_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);
        require_gt!(voter_stake, 0u64, GovernanceError::NotEnoughStake);

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;
        require!(
            self.proposal.start_epoch <= current_epoch,
            GovernanceError::VotingNotStarted
        );
        require!(
            current_epoch < self.proposal.end_epoch,
            GovernanceError::ProposalClosed
        );

        // Validate that the basis points sum to 10,000 (100%)
        let total_bp = for_votes_bp
            .checked_add(against_votes_bp)
            .and_then(|sum| sum.checked_add(abstain_votes_bp))
            .ok_or(ProgramError::ArithmeticOverflow)?;
        require!(total_bp == 10_000, GovernanceError::InvalidVoteDistribution);

        // Store the vote distribution in the Vote PDA
        self.vote.set_inner(Vote {
            validator: self.signer.key(),
            proposal: self.proposal.key(),
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            vote_timestamp: Clock::get()?.unix_timestamp,
            bump: bumps.vote,
            tallied: false,
        });
        self.proposal.vote_count += 1;

        Ok(())
    }
}
