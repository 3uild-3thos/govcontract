use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh0_10::try_from_slice_unchecked,
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    calculate_vote_lamports,
    error::GovernanceError,
    events::VoteCast,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Vote},
};
use gov_v1::MetaMerkleProof;

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Voter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
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
    /// CHECK: The snapshot program (gov-v1 or mock)
    pub snapshot_program: UncheckedAccount<'info>,
    /// CHECK: Consensus result account owned by snapshot program
    pub consensus_result: UncheckedAccount<'info>,
    /// CHECK: Meta merkle proof account owned by snapshot program
    pub meta_merkle_proof: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CastVote<'info> {
    pub fn cast_vote(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        // meta_merkle_leaf: MetaMerkleLeaf,
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

        // Validate snapshot program ownership
        require!(
            self.consensus_result.owner == self.snapshot_program.key,
            GovernanceError::MustBeOwnedBySnapshotProgram
        );
        require!(
            self.meta_merkle_proof.owner == self.snapshot_program.key,
            GovernanceError::MustBeOwnedBySnapshotProgram
        );

        // Deserialize MetaMerkleProof for crosschecking
        let account_data = self.meta_merkle_proof.try_borrow_data()?;
        let meta_merkle_proof = try_from_slice_unchecked::<MetaMerkleProof>(&account_data[8..])
            .map_err(|e| {
                msg!("Error deserializing MetaMerkleProof: {}", e);
                GovernanceError::CantDeserializeMMPPDA
            })?;
        // let meta_merkle_proof = MetaMerkleProof::try_from_slice(&account_data[8..])
        //     .map_err(|e| {
        //         msg!("Error deserializing MetaMerkleProof: {}", e);
        //         GovernanceError::CantDeserializeMMPPDA
        //     })?;
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

        require_eq!(
            meta_merkle_leaf.vote_account,
            self.spl_vote_account.key(),
            GovernanceError::InvalidVoteAccount
        );

        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            None,
            None,
        )?;

        // Calculate effective votes for each category based on actual lamports
        let voter_stake = meta_merkle_leaf.active_stake;
        let for_votes_lamports = calculate_vote_lamports!(voter_stake, for_votes_bp)?;
        let against_votes_lamports = calculate_vote_lamports!(voter_stake, against_votes_bp)?;
        let abstain_votes_lamports = calculate_vote_lamports!(voter_stake, abstain_votes_bp)?;

        self.proposal.add_vote_lamports(
            for_votes_lamports,
            against_votes_lamports,
            abstain_votes_lamports,
        )?;

        self.proposal.vote_count += 1;

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

        // Emit vote cast event
        emit!(VoteCast {
            proposal_id: self.proposal.key(),
            voter: self.signer.key(),
            vote_account: self.spl_vote_account.key(),
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
