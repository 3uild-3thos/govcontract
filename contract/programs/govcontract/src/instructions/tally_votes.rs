use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{self, program as vote_program, state::VoteState},
    },
};

use crate::{
    constants::{BASIS_POINTS_DIVISOR, VOTE_STATE_VERSION_MAX},
    error::GovernanceError,
    state::{Proposal, Vote},
    utils::get_vote_state_values,
};

#[derive(Accounts)]
pub struct TallyVotes<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Signer to trigger the tally
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: AccountInfo<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

impl<'info> TallyVotes<'info> {
    pub fn tally_votes(
        &mut self,
        remaining: &'info [AccountInfo<'info>],
        finalize: bool,
    ) -> Result<()> {
        // Check if the voting period has ended
        let clock = Clock::get()?;
        require!(
            clock.epoch >= self.proposal.end_epoch,
            GovernanceError::VotingPeriodNotEnded
        );

        let vote_account_data = &self.spl_vote_account.data.borrow();
        let (version, node_pubkey) = get_vote_state_values(vote_account_data)
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        require!(
            version <= VOTE_STATE_VERSION_MAX,
            GovernanceError::InvalidVoteAccountVersion
        );

        // Validator identity must be part of the Vote account
        require_keys_eq!(
            node_pubkey,
            self.signer.key(),
            GovernanceError::VoteNodePubkeyMismatch
        );

        if self.proposal.voting {
            self.proposal.voting = false
        }

        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        require!(
            (remaining.len() % 2) == 0,
            GovernanceError::NotEnoughAccounts
        );

        let mut vote_count = self.proposal.vote_count;
        let mut tallied_in_this_call = 0u32;

        // 2 accounts: Vote + Spl_vote
        for vote_chunk in remaining.chunks(2) {
            let vote_pda = vote_chunk
                .first()
                .ok_or(GovernanceError::NotEnoughAccounts)?;

            // Client side must add account as mutable
            require!(vote_pda.is_writable, GovernanceError::VoteImmutable);

            // Deserialize the Vote account
            let mut vote: Account<Vote> = Account::try_from(vote_pda)?;

            require!(
                vote.proposal == self.proposal.key(),
                GovernanceError::InvalidVoteAccount
            );

            if vote.tallied {
                msg!("Vote {} has already been tallied, skipping", vote.validator);
                continue;
            }

            let chunk_vote_account = vote_chunk
                .get(1)
                .ok_or(GovernanceError::NotEnoughAccounts)?;


            let data = chunk_vote_account.data.borrow();

            if chunk_vote_account.lamports() == 0
                || chunk_vote_account.owner != &vote_program::ID
                || data.len() != VoteState::size_of()
                || data.iter().all(|&byte| byte == 0)
            {
                vote.invalid = true;
                vote.tallied = true;
                tallied_in_this_call = tallied_in_this_call
                    .checked_add(1)
                    .ok_or(ProgramError::ArithmeticOverflow)?;
                vote_count = vote_count
                    .checked_sub(1)
                    .ok_or(GovernanceError::VoteCountUnderflow)?;
                msg!("SPL Vote account seems to be closed or invalid, vote skipped");
                continue;
            }

            let (chunk_version, node_pubkey) = get_vote_state_values(&data)
                .map_err(|_| GovernanceError::InvalidVoteAccountVersion)?;

            require!(
                chunk_version <= VOTE_STATE_VERSION_MAX,
                GovernanceError::InvalidVoteAccountVersion
            );

            require_keys_eq!(
                node_pubkey,
                vote.validator,
                GovernanceError::VoteNodePubkeyMismatch
            );

            // Validator stake
            let validator_stake = get_epoch_stake_for_vote_account(chunk_vote_account.key);
            require_gt!(validator_stake, 0u64, GovernanceError::NotEnoughStake);

            // Calculate effective votes for each category based on actual lamports
            // Use u128 to avoid overflow in multiplication, then divide by BASIS_POINTS_DIVISOR
            // Example (assuming validator_stake = 3372 lamports, ~0.000003372 SOL):
            // Vote Distribution: for_votes_bp = 7520, against_votes_bp = 2100, abstain_votes_bp = 380
            // Effective Votes (in lamports):
            // for_votes = (stake * for_bp) / BASIS_POINTS_DIVISOR
            // against_votes = (stake * against_bp) / BASIS_POINTS_DIVISOR
            // abstain_votes = (stake * abstain_bp) / BASIS_POINTS_DIVISOR
            // Total apportioned: 3371 lamports (minimal 1 lamport loss due to integer flooring across categories)

            let for_votes = (validator_stake as u128)
                .checked_mul(vote.for_votes_bp as u128)
                .and_then(|product| product.checked_div(BASIS_POINTS_DIVISOR as u128))
                .ok_or(ProgramError::ArithmeticOverflow)? as u64;

            let against_votes = (validator_stake as u128)
                .checked_mul(vote.against_votes_bp as u128)
                .and_then(|product| product.checked_div(BASIS_POINTS_DIVISOR as u128))
                .ok_or(ProgramError::ArithmeticOverflow)? as u64;

            let abstain_votes = (validator_stake as u128)
                .checked_mul(vote.abstain_votes_bp as u128)
                .and_then(|product| product.checked_div(BASIS_POINTS_DIVISOR as u128))
                .ok_or(ProgramError::ArithmeticOverflow)? as u64;

            // Add to the proposal's totals
            self.proposal.for_votes_lamports = self
                .proposal
                .for_votes_lamports
                .checked_add(for_votes)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            self.proposal.against_votes_lamports = self
                .proposal
                .against_votes_lamports
                .checked_add(against_votes)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            self.proposal.abstain_votes_lamports = self
                .proposal
                .abstain_votes_lamports
                .checked_add(abstain_votes)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            // Mark vote as tallied
            vote.tallied = true;

            vote_count = vote_count
                .checked_sub(1)
                .ok_or(GovernanceError::VoteCountUnderflow)?;

            // Track tallied votes
            tallied_in_this_call = tallied_in_this_call
                .checked_add(1)
                .ok_or(ProgramError::ArithmeticOverflow)?;
        }
        self.proposal.vote_count = vote_count;
        self.proposal.tallied_votes += tallied_in_this_call;

        let total_votes = self
            .proposal
            .vote_count
            .checked_add(self.proposal.tallied_votes)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        msg!(
            "Total tallied: {}/{}",
            self.proposal.tallied_votes,
            total_votes
        );

        // Mark the proposal as finalized only if all votes are tallied and vote_count is 0
        if finalize && vote_count == 0 {
            self.proposal.finalized = true;
            msg!("Proposal {} finalized successfully", self.proposal.key());
        } else if finalize && vote_count > 0 {
            msg!(
                "Cannot finalize: {} votes remaining to be tallied",
                vote_count
            );
            return Err(GovernanceError::AllVotesCount.into());
        }

        Ok(())
    }
}
