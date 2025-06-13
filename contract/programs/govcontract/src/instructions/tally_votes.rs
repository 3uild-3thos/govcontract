use crate::{
    error::GovernanceError,
    stake_weight_bp,
    state::{Proposal, Vote},
};
use anchor_lang::{prelude::*, solana_program::epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake}};

#[derive(Accounts)]
pub struct TallyVotes<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Authority to trigger the tally (e.g., governance admin)
    /// CHECK:
    pub validator: AccountInfo<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

impl<'info> TallyVotes<'info> {
    pub fn tally_votes(&mut self, remaining: &'info[AccountInfo<'info>], finalize: bool) -> Result<()> {
        // Check if the voting period has ended
        let clock = Clock::get()?;
        require!(
            clock.epoch >= self.proposal.end_epoch,
            GovernanceError::VotingPeriodNotEnded
        );
        self.proposal.voting = false;
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Get cluster stake
        let cluster_stake = get_epoch_total_stake();

        for account in remaining {
            // Deserialize the Vote account
            let vote: Account<Vote> = Account::try_from(account)?;

            // Validate the Vote account belongs to this proposal
            require!(
                vote.proposal == self.proposal.key(),
                GovernanceError::InvalidVoteAccount
            );

            // Validator stake
            let validator_stake = get_epoch_stake_for_vote_account(account.key);

            // Calculate the validator's stake weight in basis points relative to cluster stake
            let validator_weight_bp = stake_weight_bp!(validator_stake, cluster_stake)?;

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
