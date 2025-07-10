use anchor_lang::prelude::*;
use anchor_lang::solana_program::epoch_stake::get_epoch_stake_for_vote_account;
use anchor_lang::solana_program::vote::{program as vote_program, state::VoteState};

use crate::{
    error::GovernanceError,
    state::{Proposal, Vote},
};

#[derive(Accounts)]
#[instruction(for_votes_bp: u64, against_votes_bp: u64, abstain_votes_bp: u64)]
pub struct ModifyVote<'info> {
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
        mut,
        seeds = [b"vote", proposal.key().as_ref(), signer.key().as_ref()],
        bump = vote.bump,
    )]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

impl<'info> ModifyVote<'info> {
    pub fn modify_vote(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
    ) -> Result<()> {
        // Check that the proposal is open for voting
        require!(self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        let vote_account_data = self.spl_vote_account.data.borrow();
        let version = u32::from_le_bytes(
            vote_account_data[0..4]
                .try_into()
                .map_err(|_| GovernanceError::InvalidVoteAccount)?,
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
        self.vote.for_votes_bp = for_votes_bp;
        self.vote.against_votes_bp = against_votes_bp;
        self.vote.abstain_votes_bp = abstain_votes_bp;

        Ok(())
    }
}
