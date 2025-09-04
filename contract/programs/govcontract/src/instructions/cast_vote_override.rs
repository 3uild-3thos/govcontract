use anchor_lang::{
    prelude::*,
    solana_program::{
        stake::{program as stake_program, state::StakeStateV2},
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    calculate_vote_lamports,
    error::GovernanceError,
    events::VoteOverrideCast,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Vote, VoteOverride},
};
use gov_v1::{MetaMerkleProof, StakeMerkleLeaf, ID as SNAPSHOT_PROGRAM_ID};

#[derive(Accounts)]
pub struct CastVoteOverride<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (staker/delegator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal being voted on
    #[account(
        mut,
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
        seeds = [b"vote_override", proposal.key().as_ref(), spl_stake_account.key.as_ref(), validator_vote.key().as_ref()],
        bump
    )]
    pub vote_override: Account<'info, VoteOverride>, // New override account
    /// CHECK: stake account for override
    #[account(
        constraint = spl_stake_account.owner == &stake_program::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub spl_stake_account: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = snapshot_program.key == &SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = consensus_result.owner == &SNAPSHOT_PROGRAM_ID @ GovernanceError::MustBeOwnedBySnapshotProgram)]
    pub consensus_result: UncheckedAccount<'info>,
    /// CHECK:
    #[account(constraint = meta_merkle_proof.owner == &SNAPSHOT_PROGRAM_ID @ GovernanceError::MustBeOwnedBySnapshotProgram)]
    pub meta_merkle_proof: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CastVoteOverride<'info> {
    pub fn cast_vote_override(
        &mut self,
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
            .ok_or(ProgramError::ArithmeticOverflow)?;
        require!(total_bp == 10_000, GovernanceError::InvalidVoteDistribution);

        // Deserialize MetaMerkleProof for crosschecking
        let meta_account_data = self.meta_merkle_proof.try_borrow_data()?;
        let meta_merkle_proof = MetaMerkleProof::try_from_slice(&meta_account_data[8..])?;
        let meta_merkle_leaf = meta_merkle_proof.meta_merkle_leaf;

        require_eq!(
            meta_merkle_proof.consensus_result,
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
            self.spl_stake_account.key(),
            GovernanceError::InvalidStakeAccount
        );

        require_eq!(
            meta_merkle_leaf.vote_account, 
            self.spl_vote_account.key(), 
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

        // Subtract validator's vote
        self.proposal.sub_vote_lamports(
            self.validator_vote.for_votes_lamports,
            self.validator_vote.against_votes_lamports,
            self.validator_vote.abstain_votes_lamports,
        )?;

        // Add delegator's vote
        self.proposal.add_vote_lamports(
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        )?;

        let new_validator_stake = validator_stake
            .checked_sub(delegator_stake)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Calculate new validator votes for each category based on actual lamports
        let for_votes_lamports_new = calculate_vote_lamports!(new_validator_stake, self.validator_vote.for_votes_bp)?;
        let against_votes_lamports_new = calculate_vote_lamports!(new_validator_stake, self.validator_vote.against_votes_bp)?;
        let abstain_votes_lamports_new = calculate_vote_lamports!(new_validator_stake, self.validator_vote.abstain_votes_bp)?;

        // Add validator's new vote
        self.proposal.add_vote_lamports(
            for_votes_lamports_new,
            against_votes_lamports_new,
            abstain_votes_lamports_new,
        )?;

        // Store new lamports
        self.validator_vote.for_votes_lamports = for_votes_lamports_new;
        self.validator_vote.against_votes_lamports = against_votes_lamports_new;
        self.validator_vote.abstain_votes_lamports = abstain_votes_lamports_new;
        self.validator_vote.override_lamports = self.validator_vote.override_lamports.checked_add(delegator_stake).ok_or(ProgramError::ArithmeticOverflow)?;

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

        self.proposal.vote_count += 1;

        Ok(())
    }
}
