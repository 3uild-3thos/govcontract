use anchor_lang::{
    prelude::*,
    solana_program::{
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    calculate_vote_lamports,
    error::GovernanceError,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Vote},
};
use gov_v1::{MetaMerkleProof, ID as SNAPSHOT_PROGRAM_ID};

#[derive(Accounts)]
pub struct ModifyVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal being modified
    #[account(
        mut,
        seeds = [b"vote", proposal.key().as_ref(), signer.key().as_ref()],
        bump = vote.bump,
    )]
    pub vote: Account<'info, Vote>, // Existing vote to modify
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = snapshot_program.key == &SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = consensus_result.owner == &SNAPSHOT_PROGRAM_ID @ GovernanceError::MustBeOwnedBySnapshotProgram)]
    pub consensus_result: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = meta_merkle_proof.owner == &SNAPSHOT_PROGRAM_ID @ GovernanceError::MustBeOwnedBySnapshotProgram)]
    pub meta_merkle_proof: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>, // For account operations
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

        // Deserialize MetaMerkleProof for crosschecking
        let account_data = self.meta_merkle_proof.try_borrow_data()?;
        let meta_merkle_proof = MetaMerkleProof::try_from_slice(&account_data[8..])?;
        let meta_merkle_leaf = meta_merkle_proof.meta_merkle_leaf;

        // Crosscheck consensus result
        require_eq!(
            meta_merkle_proof.consensus_result,
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

        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            None,
            None,
        )?;

        // Subtract old lamports from proposal totals
        self.proposal.sub_vote_lamports(
            self.vote.for_votes_lamports,
            self.vote.against_votes_lamports,
            self.vote.abstain_votes_lamports,
        )?;

        // Calculate new effective votes for each category based on actual lamports
        let voter_stake = meta_merkle_leaf.active_stake;
        let for_votes_lamports = calculate_vote_lamports!(voter_stake, for_votes_bp)?;
        let against_votes_lamports = calculate_vote_lamports!(voter_stake, against_votes_bp)?;
        let abstain_votes_lamports = calculate_vote_lamports!(voter_stake, abstain_votes_bp)?;

        // Add new lamports to proposal totals
        self.proposal.add_vote_lamports(
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        )?;

        // Update the vote account with new distribution and lamports
        self.vote.for_votes_bp = for_votes_bp;
        self.vote.against_votes_bp = against_votes_bp;
        self.vote.abstain_votes_bp = abstain_votes_bp;
        self.vote.for_votes_lamports = for_votes_lamports;
        self.vote.against_votes_lamports = against_votes_lamports;
        self.vote.abstain_votes_lamports = abstain_votes_lamports;
        self.vote.vote_timestamp = clock.unix_timestamp;

        Ok(())
    }
}
