use anchor_lang::prelude::*;

use crate::{
    calculate_vote_lamports,
    constants::*,
    error::GovernanceError,
    events::VoteCast,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Vote},
};

#[cfg(feature = "production")]
use gov_v1::{ConsensusResult, MetaMerkleProof, ID as GOV_V1_ID };

#[cfg(feature = "testing")]
use mock_gov_v1::{ConsensusResult, MetaMerkleProof, ID as GOV_V1_ID };

#[derive(Accounts)]
#[instruction(spl_vote_account: Pubkey)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>, // New vote account
    /// CHECK: The snapshot program (gov-v1 or mock)
    #[account(
        constraint = snapshot_program.key == &GOV_V1_ID @ GovernanceError::InvalidSnapshotProgram
    )]
    pub snapshot_program: UncheckedAccount<'info>,
    pub consensus_result: Account<'info, ConsensusResult>,
    pub meta_merkle_proof: Account<'info, MetaMerkleProof>,

    pub system_program: Program<'info, System>,
}

impl<'info> CastVote<'info> {
    pub fn cast_vote(
        &mut self,
        spl_vote_account: Pubkey,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        bumps: &CastVoteBumps,
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

        // Prevent recasting if already voted
        require!(!self.vote.has_voted, GovernanceError::ValidatorAlreadyVoted);

        // Validate that the basis points sum to 10,000 (100%)
        let total_bp = for_votes_bp
            .checked_add(against_votes_bp)
            .and_then(|sum| sum.checked_add(abstain_votes_bp))
            .ok_or(GovernanceError::ArithmeticOverflow)?;
        require!(total_bp == BASIS_POINTS_MAX, GovernanceError::InvalidVoteDistribution);

        require!(
            self.consensus_result.ballot.meta_merkle_root == self.proposal.meta_merkle_root.unwrap_or_default(),
            GovernanceError::InvalidMerkleRoot
        );
        let meta_merkle_leaf = &self.meta_merkle_proof.meta_merkle_leaf;

        // Crosscheck consensus result
        require_eq!(
            self.meta_merkle_proof.consensus_result,
            self.consensus_result.key(),
            GovernanceError::InvalidConsensusResultPDA
        );

        // Ensure leaf matches signer and has sufficient stake
        require_eq!(
            meta_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );
        
        require_gt!(
            meta_merkle_leaf.active_stake,
            0u64,
            GovernanceError::NotEnoughStake
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
            None,
            None,
        )?;

        let validator_stake = meta_merkle_leaf.active_stake;

        let effective_stake = validator_stake
            .checked_sub(self.vote.override_lamports)
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        let for_votes_lamports = calculate_vote_lamports!(effective_stake, for_votes_bp)?;
        let against_votes_lamports = calculate_vote_lamports!(effective_stake, against_votes_bp)?;
        let abstain_votes_lamports = calculate_vote_lamports!(effective_stake, abstain_votes_bp)?;

        self.proposal.add_vote_lamports(
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        )?;

        self.proposal.vote_count += 1;

        self.vote.set_inner(Vote {
            validator: self.signer.key(),
            proposal: self.proposal.key(),
            stake: validator_stake,
            has_voted: true,
            bump: bumps.vote,
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
            override_lamports: self.vote.override_lamports,
            vote_timestamp: clock.unix_timestamp,
        });

        // Emit vote cast event
        emit!(VoteCast {
            proposal_id: self.proposal.key(),
            voter: self.signer.key(),
            vote_account: meta_merkle_leaf.vote_account,
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
            vote_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}
