use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{program as vote_program, state::VoteState},
    }
};

use crate::{
    error::GovernanceError,
    state::{Proposal, Vote},
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
            GovernanceError::VoteNodePubkeyMismatch
        );

        if self.proposal.voting {
            self.proposal.voting = false
        }

        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Get cluster stake
        let cluster_stake = get_epoch_total_stake();
        require_gt!(cluster_stake, 0u64, GovernanceError::InvalidClusterStake);

        require!(
            (remaining.len() % 2) == 0,
            GovernanceError::NotEnoughAccounts
        );
        let mut vote_count = self.proposal.vote_count;

        // 2 accounts: Vote + Spl_vote
        for vote_chunk in remaining.chunks(2) {
            // Deserialize the Vote account
            let vote: Account<Vote> = Account::try_from(
                vote_chunk
                    .get(0)
                    .ok_or(GovernanceError::NotEnoughAccounts)?,
            )?;

            // Validate the Vote account belongs to this proposal
            require!(
                vote.proposal == self.proposal.key(),
                GovernanceError::InvalidVoteAccount
            );

            let chunk_vote_account = vote_chunk
                .get(1)
                .ok_or(GovernanceError::NotEnoughAccounts)?;
            
            require_eq!(
                *chunk_vote_account.owner,
                vote_program::ID,
                GovernanceError::InvalidVoteAccount
            );

            let chunk_data = chunk_vote_account.data.borrow();
            let chunk_version = u32::from_le_bytes(
                chunk_data[0..4]
                    .try_into()
                    .map_err(|_| GovernanceError::InvalidVoteAccountVersion)?,
            );
            require!(
                chunk_version <= 2,
                GovernanceError::InvalidVoteAccountVersion
            );

            // 4 bytes discriminant, 32 bytes node_pubkey
            let node_pubkey = Pubkey::try_from(&chunk_data[4..36])
                .map_err(|_| GovernanceError::FailedDeserializeNodePubkey)?;

            require_keys_eq!(
                node_pubkey,
                vote.validator,
                GovernanceError::VoteNodePubkeyMismatch
            );

            // Validator stake
            let validator_stake = get_epoch_stake_for_vote_account(chunk_vote_account.key);
            require_gt!(validator_stake, 0u64, GovernanceError::NotEnoughStake);

            // Calculate effective votes for each category based on actual lamports
            // Use u128 to avoid overflow in multiplication, then divide by 10,000
            // Example (assuming validator_stake = 3372 lamports, ~0.000003372 SOL):
            // Vote Distribution: for_votes_bp = 7520, against_votes_bp = 2100, abstain_votes_bp = 380
            // Effective Votes (in lamports):
            // for_votes = (3372 * 7520) / 10_000 = 2535 (floored)
            // against_votes = (3372 * 2100) / 10_000 = 708 (floored)
            // abstain_votes = (3372 * 380) / 10_000 = 128 (floored)
            // Total apportioned: 3371 lamports (minimal 1 lamport loss due to integer flooring across categories)

            let for_votes = (validator_stake as u128)
                .checked_mul(vote.for_votes_bp as u128)
                .and_then(|product| product.checked_div(10_000))
                .ok_or(ProgramError::ArithmeticOverflow)? as u64;

            let against_votes = (validator_stake as u128)
                .checked_mul(vote.against_votes_bp as u128)
                .and_then(|product| product.checked_div(10_000))
                .ok_or(ProgramError::ArithmeticOverflow)? as u64;

            let abstain_votes = (validator_stake as u128)
                .checked_mul(vote.abstain_votes_bp as u128)
                .and_then(|product| product.checked_div(10_000))
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

            // vote.sub_lamports(vote.get_lamports())?;
            vote.to_account_info().realloc(0, false)?;
            
            vote_count -= 1;
        }
        self.proposal.vote_count = vote_count;

        // Mark the proposal as finalized
        if finalize && vote_count == 0 {
            self.proposal.finalized = true;
        } else {
            return Err(GovernanceError::AllVotesCount.into());
        }

        Ok(())
    }
}
