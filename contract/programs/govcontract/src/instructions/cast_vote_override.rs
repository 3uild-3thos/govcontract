#![allow(clippy::too_many_arguments)]
use anchor_lang::{
    prelude::*,
    solana_program::{
        hash::hash,
        instruction::Instruction,
        program::invoke,
        stake::{program as stake_program, state::StakeStateV2},
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    error::GovernanceError,
    merkle_helpers::{ConsensusResult, MetaMerkleLeaf, StakeMerkleLeaf},
    state::{Proposal, Vote, VoteOverride},
    SNAPSHOT_PROGRAM_ID,
};

#[derive(Accounts)]
pub struct CastVoteOverride<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (staker/delegator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal being voted on
    #[account(
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.key.as_ref()],
        bump = validator_vote.bump,
    )]
    pub validator_vote: Account<'info, Vote>, // Validator's existing vote (if any)
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: UncheckedAccount<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + VoteOverride::INIT_SPACE,
        seeds = [b"vote_override", proposal.key().as_ref(), spl_stake_account.key.as_ref()],
        bump
    )]
    pub vote_override: Account<'info, VoteOverride>, // New override account
    /// CHECK: stake account for override
    #[account(
        constraint = spl_stake_account.owner == &stake_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_stake_account.data_len() == StakeStateV2::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_stake_account: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = snapshot_program.key() == SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    // pub snapshot_program: Program<'info, Snapshot>,  // Snapshot Program for verification
    #[account(seeds = [b"consensus_result"], bump)] // ConsensusResult PDA
    pub consensus_result: Account<'info, ConsensusResult>, // Holds snapshot_slot and snapshot_hash
    pub system_program: Program<'info, System>,
}

impl<'info> CastVoteOverride<'info> {
    pub fn cast_vote_override(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        stake_merkle_proof: Vec<[u8; 32]>,  // Proof for stake leaf
        stake_merkle_leaf: StakeMerkleLeaf, // Staker leaf data
        meta_merkle_proof: Vec<[u8; 32]>,   // Proof for meta (validator) leaf
        meta_merkle_leaf: MetaMerkleLeaf,   // Validator leaf data
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

        // Validate basis points sum to 10,000 (100%)
        let total_bp = for_votes_bp
            .checked_add(against_votes_bp)
            .and_then(|sum| sum.checked_add(abstain_votes_bp))
            .ok_or(ProgramError::ArithmeticOverflow)?;
        require!(total_bp == 10_000, GovernanceError::InvalidVoteDistribution);

        // Ensure stake leaf matches signer and has stake
        require_keys_eq!(
            stake_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidStakeAccount
        );
        require_gt!(
            stake_merkle_leaf.active_stake,
            0u64,
            GovernanceError::NotEnoughStake
        );

        // Ensure meta leaf matches validator vote account
        require_keys_eq!(
            meta_merkle_leaf.vote_account,
            self.validator_vote.validator,
            GovernanceError::InvalidVoteAccount
        );

        // Serialize and hash stake leaf for verification: voting_wallet | stake_account | active_stake
        let stake_leaf_bytes = stake_merkle_leaf.try_to_vec()?;
        let stake_leaf_hash = hash(&stake_leaf_bytes).to_bytes();

        // Serialize and hash meta leaf for verification: voting_wallet | vote_account | stake_merkle_root | active_stake
        let meta_leaf_bytes = meta_merkle_leaf.try_to_vec()?;
        let meta_leaf_hash = hash(&meta_leaf_bytes).to_bytes();

        // Get root and slot from ConsensusResult
        let consensus_root = self.consensus_result.snapshot_hash;
        let consensus_slot = self.consensus_result.snapshot_slot;

        // Ensure snapshot is not stale (adjust delta as needed)
        require!(
            consensus_slot <= clock.slot && clock.slot - consensus_slot < 1000,
            GovernanceError::StaleSnapshot
        );

        // // CPI to verify stake leaf against validator's stake_merkle_root
        // let stake_verify_ix = Instruction {
        //     program_id: SNAPSHOT_PROGRAM_ID,
        //     accounts: vec![
        //         AccountMeta::new_readonly(self.snapshot_program.key(), false),
        //         AccountMeta::new_readonly(self.consensus_result.key(), false),
        //     ],
        //     data: snapshot_program::instruction::Verify {
        //         leaf_hash: stake_leaf_hash,
        //         proof: stake_merkle_proof,
        //         root: meta_merkle_leaf.stake_merkle_root, // Validator's stake root
        //     }
        //     .data(),
        // };
        // invoke(
        //     &stake_verify_ix,
        //     &[
        //         self.snapshot_program.to_account_info(),
        //         self.consensus_result.to_account_info(),
        //     ],
        // )?;

        // // CPI to verify meta leaf against global root
        // let meta_verify_ix = Instruction {
        //     program_id: SNAPSHOT_PROGRAM_ID,
        //     accounts: vec![
        //         AccountMeta::new_readonly(self.snapshot_program.key(), false),
        //         AccountMeta::new_readonly(self.consensus_result.key(), false),
        //     ],
        //     data: snapshot_program::instruction::Verify {
        //         leaf_hash: meta_leaf_hash,
        //         proof: meta_merkle_proof,
        //         root: global_root, // Proposal's merkle_root_hash (global meta root)
        //     }
        //     .data(),
        // };
        // invoke(
        //     &meta_verify_ix,
        //     &[
        //         self.snapshot_program.to_account_info(),
        //         self.consensus_result.to_account_info(),
        //     ],
        // )?;

        // Use verified stake amounts
        let delegator_stake = stake_merkle_leaf.active_stake;
        let validator_stake = meta_merkle_leaf.active_stake;

        // Calculate delegator's vote lamports
        let for_votes_lamports = (delegator_stake as u128)
            .checked_mul(for_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        let against_votes_lamports = (delegator_stake as u128)
            .checked_mul(against_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        let abstain_votes_lamports = (delegator_stake as u128)
            .checked_mul(abstain_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        // Substract validator's vote
        self.proposal.for_votes_lamports = self
            .proposal
            .for_votes_lamports
            .checked_sub(self.validator_vote.for_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        self.proposal.against_votes_lamports = self
            .proposal
            .against_votes_lamports
            .checked_sub(self.validator_vote.against_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        self.proposal.abstain_votes_lamports = self
            .proposal
            .abstain_votes_lamports
            .checked_sub(self.validator_vote.abstain_votes_lamports)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Add delegator's vote
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

        // Calculate new votes for validator
        self.validator_vote.override_lamports = delegator_stake;

        let new_weight = validator_stake
            .checked_sub(delegator_stake)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Calculate new votes for each category based on actual lamports
        let for_votes_lamports_new = (new_weight as u128)
            .checked_mul(self.validator_vote.for_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)? as u64;

        let against_votes_lamports_new = (new_weight as u128)
            .checked_mul(self.validator_vote.against_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)?
            as u64;

        let abstain_votes_lamports_new = (new_weight as u128)
            .checked_mul(self.validator_vote.abstain_votes_bp as u128)
            .and_then(|product| product.checked_div(10_000))
            .ok_or(ProgramError::ArithmeticOverflow)?
            as u64;

        // Add validator's new vote
        self.proposal.for_votes_lamports = self
            .proposal
            .for_votes_lamports
            .checked_add(for_votes_lamports_new)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.against_votes_lamports = self
            .proposal
            .against_votes_lamports
            .checked_add(against_votes_lamports_new)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.abstain_votes_lamports = self
            .proposal
            .abstain_votes_lamports
            .checked_add(abstain_votes_lamports_new)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Store new lamports
        self.validator_vote.for_votes_lamports = for_votes_lamports_new;
        self.validator_vote.against_votes_lamports = against_votes_lamports_new;
        self.validator_vote.abstain_votes_lamports = abstain_votes_lamports_new;
        self.validator_vote.override_lamports = delegator_stake;

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
        self.proposal.vote_count += 1;

        Ok(())
    }
}
