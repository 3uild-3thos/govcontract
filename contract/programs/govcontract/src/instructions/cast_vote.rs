use anchor_lang::{
    prelude::*,
    solana_program::{
        hash::hash, instruction::Instruction, 
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
pub struct CastVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal being voted on
    #[account(
        init,
        payer = signer,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>, // New vote account
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = snapshot_program.key() == SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    // pub snapshot_program: Program<'info, Snapshot>,  // Snapshot Program for verification
    #[account(seeds = [b"consensus_result"], bump)] // ConsensusResult PDA
    pub consensus_result: Account<'info, ConsensusResult>, // Holds snapshot_slot and snapshot_hash
    pub system_program: Program<'info, System>, // For account creation
}

impl<'info> CastVote<'info> {
    pub fn cast_vote(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        meta_merkle_proof: Vec<[u8; 32]>, // Merkle proof for validator leaf
        meta_merkle_leaf: MetaMerkleLeaf, // Validator leaf data
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

        // Get root and slot from ConsensusResult
        let consensus_root = self.consensus_result.snapshot_hash;
        let consensus_slot = self.consensus_result.snapshot_slot;

        // Ensure snapshot is correct
        require!(
            consensus_slot <= clock.slot,
            GovernanceError::InvalidSnapshotSlot
        );

        // CPI to verify Merkle inclusion
        // let verify_ix = Instruction {
        //     program_id: SNAPSHOT_PROGRAM_ID,
        //     accounts: vec![
        //         AccountMeta::new_readonly(*self.snapshot_program.key, false),
        //         AccountMeta::new_readonly(*self.consensus_result.key, false),  // Vrify reads ConsensusResult
        //     ],
        //     data: snapshot_program::instruction::Verify {
        //         leaf_hash,
        //         proof: meta_merkle_proof,
        //         root,
        //     }.data(),
        // };
        // invoke(&verify_ix, &[self.snapshot_program.to_account_info(), self.consensus_result.to_account_info()])?;

        // Calculate effective votes for each category based on actual lamports
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

        // Store the vote distribution in the Vote PDA
        self.vote.set_inner(Vote {
            validator: self.signer.key(),
            proposal: self.proposal.key(),
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
            override_lamports: 0,
            stake: voter_stake,
            vote_timestamp: clock.unix_timestamp,
            bump: bumps.vote,
        });

        self.proposal
            .for_votes_lamports
            .checked_add(for_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal
            .against_votes_lamports
            .checked_add(against_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal
            .abstain_votes_lamports
            .checked_add(abstain_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.vote_count += 1;

        Ok(())
    }
}
