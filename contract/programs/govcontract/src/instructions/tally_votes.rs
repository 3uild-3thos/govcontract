use crate::{
    error::GovernanceError,
    stake_weight_bp,
    state::{Proposal, Vote},
};
use anchor_lang::solana_program::vote::{program as vote_program, state::VoteState};
use anchor_lang::{
    prelude::*,
    solana_program::epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
};

#[derive(Accounts)]
pub struct TallyVotes<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Signer to trigger the tally
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() >= VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
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
        self.proposal.voting = false;
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Get cluster stake
        let cluster_stake = get_epoch_total_stake();
        require_gt!(cluster_stake, 0u64, GovernanceError::InvalidClusterStake);

        require!(
            (remaining.len() % 2) == 0,
            GovernanceError::NotEnoughAccounts
        );

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
            // require_eq!(
            //     chunk_vote_account.data_len(),
            //     VoteState::size_of(),
            //     GovernanceError::InvalidVoteAccount
            // );
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

            // Calculate the validator's stake weight in basis points relative to cluster stake
            let validator_weight_bp = TryInto::<u64>::try_into(stake_weight_bp!(
                validator_stake as u128,
                cluster_stake as u128
            )?)?;

            // Calculate effective votes for each category based on validator's stake weight
            // Validator Weight: (50,000 * 10,000) / 380,000,000 ≈ 13 bp
            // Vote Distribution: Suppose
            // for_votes_bp = 7000, against_votes_bp = 2000, abstain_votes_bp = 1000 (total = 10,000 bp)
            // Effective Votes:
            // for_votes = (13 * 7000) / 10,000 = 9
            // against_votes = (13 * 2000) / 10,000 = 2
            // abstain_votes = (13 * 1000) / 10,000 = 1

            let for_votes = (validator_weight_bp)
                .checked_mul(vote.for_votes_bp)
                .and_then(|product| product.checked_div(10_000))
                .ok_or(ProgramError::ArithmeticOverflow)?;

            let against_votes = (validator_weight_bp)
                .checked_mul(vote.against_votes_bp)
                .and_then(|product| product.checked_div(10_000))
                .ok_or(ProgramError::ArithmeticOverflow)?;

            let abstain_votes = (validator_weight_bp)
                .checked_mul(vote.abstain_votes_bp)
                .and_then(|product| product.checked_div(10_000))
                .ok_or(ProgramError::ArithmeticOverflow)?;

            // Add to the proposal's totals
            self.proposal.for_votes_bp = self
                .proposal
                .for_votes_bp
                .checked_add(for_votes)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            self.proposal.against_votes_bp = self
                .proposal
                .against_votes_bp
                .checked_add(against_votes)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            self.proposal.abstain_votes_bp = self
                .proposal
                .abstain_votes_bp
                .checked_add(abstain_votes)
                .ok_or(ProgramError::ArithmeticOverflow)?;
        }

        // Mark the proposal as finalized
        if finalize {
            self.proposal.finalized = true;
        }

        Ok(())
    }
}
