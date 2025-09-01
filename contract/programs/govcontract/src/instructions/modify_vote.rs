use anchor_lang::{
    prelude::*,
    solana_program::{
        hash::hash,
        instruction::Instruction,
        native_token::LAMPORTS_PER_SOL,
        program::invoke,
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    error::GovernanceError,
    merkle_helpers::{ConsensusResult, MetaMerkleLeaf},
    state::{Proposal, Vote},
    SNAPSHOT_PROGRAM_ID,
};

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
    #[account(constraint = snapshot_program.key() == SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    // pub snapshot_program: Program<'info, Snapshot>,  // Snapshot Program for verification, uncomment in production
    #[account(seeds = [b"consensus_result"], bump)] // ConsensusResult PDA
    pub consensus_result: Account<'info, ConsensusResult>, // Holds snapshot_slot and snapshot_hash
    pub system_program: Program<'info, System>, // For account operations
}

impl<'info> ModifyVote<'info> {
    pub fn modify_vote(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        meta_merkle_proof: Vec<[u8; 32]>, // Merkle proof for validator leaf
        meta_merkle_leaf: MetaMerkleLeaf, // Validator leaf data
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

        // Ensure leaf matches signer and has sufficient stake
        require_keys_eq!(
            meta_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );
        require_gt!(
            meta_merkle_leaf.active_stake,
            0u64,
            GovernanceError::NotEnoughStake
        );

        // Hash the leaf for verification
        let leaf_bytes = meta_merkle_leaf.try_to_vec()?;
        let leaf_hash = hash(&leaf_bytes).to_bytes();

        // Get root and slot from ConsensusResult
        let root = self.consensus_result.snapshot_hash;
        let snapshot_slot = self.consensus_result.snapshot_slot;

        // Ensure snapshot is not stale (adjust delta as needed)
        require!(
            snapshot_slot <= clock.slot && clock.slot - snapshot_slot < 1000,
            GovernanceError::StaleSnapshot
        );

        // CPI to verify Merkle inclusion
        // let verify_ix = Instruction {
        //     program_id: SNAPSHOT_PROGRAM_ID,
        //     accounts: vec![
        //         AccountMeta::new_readonly(self.snapshot_program.key(), false),
        //         AccountMeta::new_readonly(self.consensus_result.key(), false),  // If verify reads ConsensusResult
        //     ],
        //     data: snapshot_program::instruction::Verify {
        //         leaf_hash,
        //         proof: meta_merkle_proof,
        //         root,
        //     }.data(),
        // };
        // invoke(&verify_ix, &[self.snapshot_program.to_account_info(), self.consensus_result.to_account_info()])?;

        // Subtract old lamports from proposal totals
        self.proposal.for_votes_lamports = self
            .proposal
            .for_votes_lamports
            .checked_sub(self.vote.for_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.against_votes_lamports = self
            .proposal
            .against_votes_lamports
            .checked_sub(self.vote.against_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.abstain_votes_lamports = self
            .proposal
            .abstain_votes_lamports
            .checked_sub(self.vote.abstain_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Calculate new effective votes for each category based on actual lamports
        let voter_stake = meta_merkle_leaf.active_stake;
        let for_votes_lamports = (voter_stake as u128)
            .checked_mul(for_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        let against_votes_lamports = (voter_stake as u128)
            .checked_mul(against_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        let abstain_votes_lamports = (voter_stake as u128)
            .checked_mul(abstain_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        // Add new lamports to proposal totals
        self.proposal.for_votes_lamports = self
            .proposal
            .for_votes_lamports
            .checked_add(for_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.against_votes_lamports = self
            .proposal
            .against_votes_lamports
            .checked_add(against_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.abstain_votes_lamports = self
            .proposal
            .abstain_votes_lamports
            .checked_add(abstain_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;

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
