use anchor_lang::prelude::*;

use crate::{
    calculate_vote_lamports,
    constants::*,
    error::GovernanceError,
    events::VoteOverrideCast,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Vote, VoteOverride},
};

#[cfg(feature = "production")]
use gov_v1::{ConsensusResult, MetaMerkleProof, StakeMerkleLeaf, ID as GOV_V1_ID};
#[cfg(feature = "testing")]
use mock_gov_v1::{ConsensusResult, MetaMerkleProof, StakeMerkleLeaf, ID as GOV_V1_ID};

#[derive(Accounts)]
#[instruction(spl_vote_account: Pubkey, spl_stake_account: Pubkey)]
pub struct CastVoteOverride<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (staker/delegator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal being voted on
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.as_ref()],
        bump
    )]
    pub validator_vote: Account<'info, Vote>, // Validator's existing vote (if any)
    #[account(
        init,
        payer = signer,
        space = 8 + VoteOverride::INIT_SPACE,
        seeds = [b"vote_override", proposal.key().as_ref(), spl_stake_account.as_ref(), validator_vote.key().as_ref()],
        bump
    )]
    pub vote_override: Account<'info, VoteOverride>, // New override account
    /// CHECK: The snapshot program (gov-v1 or mock)
    #[account(
        constraint = snapshot_program.key == &GOV_V1_ID @ GovernanceError::InvalidSnapshotProgram
    )]
    pub snapshot_program: UncheckedAccount<'info>,
    pub consensus_result: Account<'info, ConsensusResult>,
    pub meta_merkle_proof: Account<'info, MetaMerkleProof>,

    pub system_program: Program<'info, System>,
}

impl<'info> CastVoteOverride<'info> {
    pub fn cast_vote_override(
        &mut self,
        spl_vote_account: Pubkey,
        spl_stake_account: Pubkey,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        stake_merkle_proof: Vec<[u8; 32]>,
        stake_merkle_leaf: StakeMerkleLeaf,
        bumps: &CastVoteOverrideBumps,
    ) -> Result<()> {
        // Check that the proposal is open for voting
        require!(self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

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
            .ok_or(GovernanceError::ArithmeticOverflow)?;
        require!(
            total_bp == BASIS_POINTS_MAX,
            GovernanceError::InvalidVoteDistribution
        );

        require!(
            self.consensus_result.ballot.meta_merkle_root
                == self.proposal.meta_merkle_root.unwrap_or_default(),
            GovernanceError::InvalidMerkleRoot
        );

        let meta_merkle_leaf = &self.meta_merkle_proof.meta_merkle_leaf;

        require_eq!(
            self.meta_merkle_proof.consensus_result,
            self.consensus_result.key(),
            GovernanceError::InvalidConsensusResultPDA
        );

        require_eq!(
            stake_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidStakeAccount
        );

        require_gt!(
            stake_merkle_leaf.active_stake,
            0u64,
            GovernanceError::NotEnoughStake
        );

        // Ensure stake leaf contains the correct stake account
        require_eq!(
            stake_merkle_leaf.stake_account,
            spl_stake_account,
            GovernanceError::InvalidStakeAccount
        );

        require_eq!(
            meta_merkle_leaf.vote_account,
            spl_vote_account,
            GovernanceError::InvalidVoteAccount
        );

        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            Some(stake_merkle_proof),
            Some(stake_merkle_leaf.clone()),
        )?;

        // Use verified stake amounts
        let delegator_stake = stake_merkle_leaf.active_stake;
        let validator_stake = meta_merkle_leaf.active_stake;

        // Calculate delegator's vote lamports
        let for_votes_lamports = calculate_vote_lamports!(delegator_stake, for_votes_bp)?;
        let against_votes_lamports = calculate_vote_lamports!(delegator_stake, against_votes_bp)?;
        let abstain_votes_lamports = calculate_vote_lamports!(delegator_stake, abstain_votes_bp)?;

        // Add delegator's vote to proposal
        self.proposal.add_vote_lamports(
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        )?;

        // Initialize validator vote account if validator not yet voted
        if !self.validator_vote.has_voted {
            self.validator_vote.set_inner(Vote {
                validator: meta_merkle_leaf.voting_wallet,
                proposal: self.proposal.key(),
                has_voted: false,
                bump: bumps.validator_vote,
                override_lamports: self.validator_vote.override_lamports,
                ..Vote::default()
            });
        }

        // If validator has already voted, adjust validator values in vote and proposal
        if self.validator_vote.has_voted {
            // Substract validator vote lamports from proposal
            self.proposal.sub_vote_lamports(
                self.validator_vote.for_votes_lamports,
                self.validator_vote.against_votes_lamports,
                self.validator_vote.abstain_votes_lamports,
            )?;

            // Calculate new validator votes, substracting delegator stake from validator vote
            let new_validator_stake = self
                .validator_vote
                .stake
                .checked_sub(delegator_stake)
                .ok_or(GovernanceError::ArithmeticOverflow)?;

            let for_votes_lamports_new =
                calculate_vote_lamports!(new_validator_stake, self.validator_vote.for_votes_bp)?;
            let against_votes_lamports_new = calculate_vote_lamports!(
                new_validator_stake,
                self.validator_vote.against_votes_bp
            )?;
            let abstain_votes_lamports_new = calculate_vote_lamports!(
                new_validator_stake,
                self.validator_vote.abstain_votes_bp
            )?;

            // Add new validator vote lamports to proposal
            self.proposal.add_vote_lamports(
                for_votes_lamports_new,
                against_votes_lamports_new,
                abstain_votes_lamports_new,
            )?;

            // Store new validator vote lamports
            self.validator_vote.for_votes_lamports = for_votes_lamports_new;
            self.validator_vote.against_votes_lamports = against_votes_lamports_new;
            self.validator_vote.abstain_votes_lamports = abstain_votes_lamports_new;
        }

        self.proposal.vote_count += 1;

        // Store override lamports in vote account
        self.validator_vote.override_lamports = self
            .validator_vote
            .override_lamports
            .checked_add(delegator_stake)
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        // Store override
        self.vote_override.set_inner(VoteOverride {
            stake_account: stake_merkle_leaf.stake_account,
            validator: meta_merkle_leaf.vote_account,
            proposal: self.proposal.key(),
            vote_account_validator: self.validator_vote.key(),
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            stake_amount: delegator_stake,
            vote_override_timestamp: clock.unix_timestamp,
            bump: bumps.vote_override,
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        });

        // Emit vote override cast event
        emit!(VoteOverrideCast {
            proposal_id: self.proposal.key(),
            delegator: self.signer.key(),
            stake_account: stake_merkle_leaf.stake_account,
            validator: meta_merkle_leaf.vote_account,
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
            stake_amount: delegator_stake,
            vote_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}
