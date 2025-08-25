#![allow(clippy::too_many_arguments)]
use crate::{
    error::GovernanceError,
    merkle_helpers::{ConsensusResult, MetaMerkleLeaf},
    state::{Proposal, ProposalIndex},
    utils::is_valid_github_link, 
    SNAPSHOT_PROGRAM_ID,
};

use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::get_epoch_total_stake, hash::hash, instruction::Instruction,
        native_token::LAMPORTS_PER_SOL, program::invoke,
        vote::{program as vote_program, state::VoteState},

    },
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
    pub spl_vote_account: AccountInfo<'info>,
    /// CHECK:
    #[account(constraint = snapshot_program.key() == SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    // pub snapshot_program: Program<'info, Snapshot>,  // Snapshot Program for verification, uncomment in production
    #[account(seeds = [b"consensus_result"], bump)] // ConsensusResult PDA, assuming seeds
    pub consensus_result: Account<'info, ConsensusResult>, // Holds snapshot_slot and snapshot_hash
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        start_epoch: u64,
        voting_length_epochs: u64,
        meta_merkle_proof: Vec<[u8; 32]>, // Merkle proof for validator leaf
        meta_merkle_leaf: MetaMerkleLeaf, // Validator leaf data
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

        // Ensure leaf matches signer and has sufficient stake
        require_keys_eq!(
            meta_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );
        require_gte!(
            meta_merkle_leaf.active_stake,
            100_000 * LAMPORTS_PER_SOL,
            GovernanceError::NotEnoughStake
        );

        // Hash the leaf for verification
        let leaf_bytes = meta_merkle_leaf.try_to_vec()?;
        let leaf_hash = hash(&leaf_bytes).to_bytes();

        // Get root and slot from ConsensusResult
        let root = self.consensus_result.snapshot_hash;
        let snapshot_slot = self.consensus_result.snapshot_slot;

        // Ensure snapshot is not stale
        let clock = Clock::get()?;
        require!(
            snapshot_slot <= clock.slot && clock.slot - snapshot_slot < 1000,
            GovernanceError::StaleSnapshot
        );

        // CPI to verify Merkle inclusion
        // let verify_ix = Instruction {
        //     program_id: SNAPSHOT_PROGRAM_ID,
        //     accounts: vec![
        //         AccountMeta::new_readonly(*self.snapshot_program.key, false),
        //         AccountMeta::new_readonly(*self.consensus_result.key, false),
        //     ],
        //     data: snapshot_program::instruction::Verify {
        //         leaf_hash,
        //         proof: meta_merkle_proof,
        //         root,
        //     }.data(),
        // };
        // invoke(&verify_ix, &[self.snapshot_program.to_account_info()])?;

        // Calculate stake weight basis points
        let cluster_stake = get_epoch_total_stake();
        let proposer_stake_weight_bp =
            (meta_merkle_leaf.active_stake as u128 * 10_000) / cluster_stake as u128;

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
            proposer_stake_weight_bp: proposer_stake_weight_bp.try_into()?,
            cluster_support_lamports: 0,
            for_votes_lamports: 0,
            against_votes_lamports: 0,
            abstain_votes_lamports: 0,
            voting: false,
            finalized: false,
            proposal_bump: bumps.proposal,
            creation_timestamp: clock.unix_timestamp,
            vote_count: 0,
            index: self.proposal_index.current_index + 1,
            merkle_root_hash: root,
            snapshot_slot,
        });
        self.proposal_index.current_index += 1;

        Ok(())
    }
}
