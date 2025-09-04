#![allow(clippy::too_many_arguments)]

use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake}, native_token::LAMPORTS_PER_SOL, vote::{program as vote_program, state::VoteState}
    },
};

use gov_v1::{MetaMerkleProof, ID as SNAPSHOT_PROGRAM_ID};

use crate::{
    error::GovernanceError,
    events::ProposalCreated,
    merkle_helpers::verify_merkle_proof_cpi,
    stake_weight_bp,
    state::{Proposal, ProposalIndex},
    utils::is_valid_github_link,
};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal creator (validator)
    #[account(
        init,
        payer = signer,
        seeds = [b"proposal", seed.to_le_bytes().as_ref(), spl_vote_account.key().as_ref()],
        bump,
        space = 8 + Proposal::INIT_SPACE,
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        mut,
        seeds = [b"index"],
        bump = proposal_index.bump
    )]
    pub proposal_index: Account<'info, ProposalIndex>,
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
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        start_epoch: u64,
        voting_length_epochs: u64,
        bumps: &CreateProposalBumps,
    ) -> Result<()> {
        // Validate proposal inputs
        require!(title.len() <= 50, GovernanceError::TitleTooLong);
        require!(
            description.len() <= 250,
            GovernanceError::DescriptionTooLong
        );
        require!(
            is_valid_github_link(&description),
            GovernanceError::DescriptionInvalid
        );
        require_gt!(
            voting_length_epochs,
            0u64,
            GovernanceError::InvalidVotingLength
        );

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

        require_gte!(
            meta_merkle_leaf.active_stake,
            100_000 * LAMPORTS_PER_SOL, // 100k SOL in lamports
            GovernanceError::NotEnoughStake
        );

        // Verify merkle proof via CPI
        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            None, // No stake proof for validator proposal creation
            None, // No stake leaf for validator proposal creation
        )?;

        let clock = Clock::get()?;
        
        require_gte!(
            start_epoch, 
            clock.epoch, 
            GovernanceError::InvalidStartEpoch
        );

        // Calculate stake weight basis points
        let cluster_stake = get_epoch_total_stake();
        let proposer_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);
        let proposer_stake_weight_bp = stake_weight_bp!(proposer_stake, cluster_stake)?;

        // Initialize proposal account
        self.proposal.set_inner(Proposal {
            author: self.signer.key(),
            title,
            description,
            creation_epoch: clock.epoch,
            start_epoch,
            end_epoch: start_epoch
                .checked_add(voting_length_epochs)
                .ok_or(ProgramError::ArithmeticOverflow)?,
            proposer_stake_weight_bp,
            proposal_bump: bumps.proposal,
            creation_timestamp: clock.unix_timestamp,
            index: self.proposal_index.current_index + 1,
            snapshot_slot: clock.slot,
            ..Proposal::default()
        });
        self.proposal_index.current_index += 1;

        // Emit proposal created event
        emit!(ProposalCreated {
            proposal_id: self.proposal.key(),
            author: self.signer.key(),
            title: self.proposal.title.clone(),
            description: self.proposal.description.clone(),
            start_epoch: self.proposal.start_epoch,
            end_epoch: self.proposal.end_epoch,
            snapshot_slot: self.proposal.snapshot_slot,
            creation_timestamp: self.proposal.creation_timestamp,
        });

        Ok(())
    }
}
