use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh0_10::try_from_slice_unchecked,
        epoch_stake::get_epoch_total_stake,
        vote::{program as vote_program, state::VoteState},
    },
};

use gov_v1::{ConsensusResult, MetaMerkleProof};

use crate::{
    constants::*,
    error::GovernanceError,
    events::ProposalSupported,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Support},
};

#[derive(Accounts)]
pub struct SupportProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal supporter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = 8 + Support::INIT_SPACE,
        seeds = [b"support", proposal.key().as_ref(), spl_vote_account.key().as_ref()],
        bump
    )]
    pub support: Account<'info, Support>, // New support account
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

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(&mut self, bumps: &SupportProposalBumps) -> Result<()> {
        let clock = Clock::get()?;

        // Ensure proposal is eligible for support
        require!(
            clock.epoch <= self.proposal.start_epoch,
            GovernanceError::ProposalClosed
        );
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Check if support period has expired
        require!(
            clock.epoch <= self.proposal.creation_epoch + MAX_SUPPORT_EPOCHS,
            GovernanceError::SupportPeriodExpired
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

        let consensus_result_data = self.consensus_result.try_borrow_data()?;
        let consensus_result = try_from_slice_unchecked::<ConsensusResult>(
            &consensus_result_data[8..],
        )
        .map_err(|e| {
            msg!("Error deserializing ConsensusResult: {}", e);
            GovernanceError::CantDeserializeConsensusResult
        })?;

        let merkle_root = self
            .proposal
            .merkle_root_hash
            .ok_or(GovernanceError::MerkleRootNotSet)?;
        require!(
            consensus_result.ballot.meta_merkle_root == merkle_root,
            GovernanceError::InvalidMerkleRoot
        );

        // Deserialize MetaMerkleProof for crosschecking
        let account_data = self.meta_merkle_proof.try_borrow_data()?;
        let meta_merkle_proof = try_from_slice_unchecked::<MetaMerkleProof>(&account_data[8..])
            .map_err(|e| {
                msg!("Error deserializing MetaMerkleProof: {}", e);
                GovernanceError::CantDeserializeMMPPDA
            })?;
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

        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            None,
            None,
        )?;

        // Add the supporter's stake (from verified leaf) to the proposal's cluster support
        self.proposal
            .add_cluster_support(meta_merkle_leaf.active_stake)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        let cluster_stake = get_epoch_total_stake();
        let support_scaled =
            (self.proposal.cluster_support_lamports as u128) * CLUSTER_SUPPORT_MULTIPLIER;
        let cluster_scaled = (cluster_stake as u128) * CLUSTER_STAKE_MULTIPLIER;
        let voting_activated = if support_scaled >= cluster_scaled {
            // Activate voting if threshold met
            self.proposal.start_epoch = clock.epoch + 4;
            self.proposal.end_epoch = self.proposal.start_epoch + 3;
            true
        } else {
            false
        };

        emit!(ProposalSupported {
            proposal_id: self.proposal.key(),
            supporter: self.signer.key(),
            cluster_support_lamports: self.proposal.cluster_support_lamports,
            voting_activated,
        });

        Ok(())
    }
}
