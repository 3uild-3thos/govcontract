use anchor_lang::prelude::*;

use crate::{
    calculate_vote_lamports,
    constants::*,
    error::GovernanceError,
    events::VoteModified,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Vote},
};

#[cfg(feature = "production")]
use gov_v1::{ConsensusResult, MetaMerkleProof, ID as GOV_V1_ID};
#[cfg(feature = "testing")]
use mock_gov_v1::{ConsensusResult, MetaMerkleProof, ID as GOV_V1_ID};

#[derive(Accounts)]
#[instruction(spl_vote_account: Pubkey)]
pub struct ModifyVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal being modified
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    /// CHECK: The snapshot program (gov-v1 or mock)
    #[account(
        constraint = snapshot_program.key == &GOV_V1_ID @ GovernanceError::InvalidSnapshotProgram
    )]
    pub snapshot_program: UncheckedAccount<'info>,
    pub consensus_result: Account<'info, ConsensusResult>,
    pub meta_merkle_proof: Account<'info, MetaMerkleProof>,
    pub system_program: Program<'info, System>, // For account operations
}

impl<'info> ModifyVote<'info> {
    pub fn modify_vote(
        &mut self,
        spl_vote_account: Pubkey,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        bumps: &ModifyVoteBumps,
    ) -> Result<()> {
        // Check that the proposal is open for voting and not finalized
        require!(self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Verify validator has already voted
        require!(self.vote.has_voted, GovernanceError::ValidatorHasNotVoted);

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;

        // Verify proposal start epoch is already passed
        require!(
            self.proposal.start_epoch <= current_epoch,
            GovernanceError::VotingNotStarted
        );

        // Verify proposal voting period is not ended
        require!(
            current_epoch < self.proposal.end_epoch,
            GovernanceError::ProposalClosed
        );

        // Verify that the basis points sum to 10,000 (100%)
        let total_bp = for_votes_bp
            .checked_add(against_votes_bp)
            .and_then(|sum| sum.checked_add(abstain_votes_bp))
            .ok_or(GovernanceError::ArithmeticOverflow)?;
        require!(
            total_bp == BASIS_POINTS_MAX,
            GovernanceError::InvalidVoteDistribution
        );

        // Verify consensus result merkle root matches proposal merkle root
        require!(
            self.consensus_result.ballot.meta_merkle_root
                == self.proposal.meta_merkle_root.unwrap_or_default(),
            GovernanceError::InvalidMerkleRoot
        );

        let meta_merkle_leaf = &self.meta_merkle_proof.meta_merkle_leaf;

        // Verify consensus result PDA passed in matches consensus result PDA in proposal
        require_eq!(
            self.meta_merkle_proof.consensus_result,
            self.consensus_result.key(),
            GovernanceError::InvalidConsensusResultPDA
        );

        // Verify leaf matches signer
        require_eq!(
            meta_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );

        // Verify leaf contains the correct validator vote account
        require_eq!(
            meta_merkle_leaf.vote_account,
            spl_vote_account,
            GovernanceError::InvalidVoteAccount
        );

        // Verify leaf has sufficient stake
        require_gt!(
            meta_merkle_leaf.active_stake,
            0u64,
            GovernanceError::NotEnoughStake
        );

        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            None,
            None,
        )?;

        // Subtract old vote lamports from proposal totals
        self.proposal.sub_vote_lamports(
            self.vote.for_votes_lamports,
            self.vote.against_votes_lamports,
            self.vote.abstain_votes_lamports,
        )?;

        // Calculate new effective stake substracting possible override lamports
        let effective_stake = self
            .vote
            .stake
            .checked_sub(self.vote.override_lamports)
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        // Calculate new vote lamports based on effective stake
        let for_votes_lamports = calculate_vote_lamports!(effective_stake, for_votes_bp)?;
        let against_votes_lamports = calculate_vote_lamports!(effective_stake, against_votes_bp)?;
        let abstain_votes_lamports = calculate_vote_lamports!(effective_stake, abstain_votes_bp)?;

        // Add new vote lamports to proposal totals
        self.proposal.add_vote_lamports(
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        )?;

        // Update vote account
        self.vote.for_votes_bp = for_votes_bp;
        self.vote.against_votes_bp = against_votes_bp;
        self.vote.abstain_votes_bp = abstain_votes_bp;
        self.vote.for_votes_lamports = for_votes_lamports;
        self.vote.against_votes_lamports = against_votes_lamports;
        self.vote.abstain_votes_lamports = abstain_votes_lamports;
        self.vote.vote_timestamp = clock.unix_timestamp;

        emit!(VoteModified {
            proposal_id: self.proposal.key(),
            voter: self.signer.key(),
            vote_account: spl_vote_account,
            old_for_votes_bp: self.vote.for_votes_bp,
            old_against_votes_bp: self.vote.against_votes_bp,
            old_abstain_votes_bp: self.vote.abstain_votes_bp,
            new_for_votes_bp: for_votes_bp,
            new_against_votes_bp: against_votes_bp,
            new_abstain_votes_bp: abstain_votes_bp,
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
            modification_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}
