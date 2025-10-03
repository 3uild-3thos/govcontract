#![allow(clippy::too_many_arguments)]

use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh0_10::try_from_slice_unchecked,
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        native_token::LAMPORTS_PER_SOL,
        vote::{program as vote_program, state::VoteState},
    },
};

use gov_v1::{ConsensusResult, MetaMerkleProof};

use crate::{
    constants::*,
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
    /// CHECK: The snapshot program (gov-v1 or mock)
    pub snapshot_program: UncheckedAccount<'info>,
    /// CHECK: Consensus result account owned by snapshot program
    pub consensus_result: UncheckedAccount<'info>,
    /// CHECK: Meta merkle proof account owned by snapshot program
    pub meta_merkle_proof: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        bumps: &CreateProposalBumps,
    ) -> Result<()> {
        // Validate proposal inputs
        require!(!title.is_empty(), GovernanceError::TitleEmpty);
        require!(
            title.len() <= MAX_TITLE_LENGTH,
            GovernanceError::TitleTooLong
        );
        require!(!description.is_empty(), GovernanceError::DescriptionEmpty);
        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            GovernanceError::DescriptionTooLong
        );
        require!(
            is_valid_github_link(&description),
            GovernanceError::DescriptionInvalid
        );

        // Validate snapshot program ownership
        require!(
            self.consensus_result.owner == self.snapshot_program.key,
            GovernanceError::MustBeOwnedBySnapshotProgram
        );
        require!(
            self.meta_merkle_proof.owner == self.snapshot_program.key,
            GovernanceError::MustBeOwnedBySnapshotProgram
        );

        // let consensus_result_data = self.consensus_result.try_borrow_data()?;
        // let consensus_result = try_from_slice_unchecked::<ConsensusResult>(&consensus_result_data[8..])
        //     .map_err(|e| {
        //         msg!("Error deserializing ConsensusResult: {}", e);
        //         GovernanceError::CantDeserializeConsensusResult
        //     })?;

        // require!(
        //     consensus_result.ballot.meta_merkle_root == self.proposal.merkle_root_hash.unwrap(),
        //     GovernanceError::InvalidMerkleRoot
        // );
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

        require_gte!(
            meta_merkle_leaf.active_stake,
            MIN_PROPOSAL_STAKE_LAMPORTS, // 100k SOL
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
            start_epoch: 0,
            end_epoch: 0,
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
