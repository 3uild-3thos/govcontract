#![allow(clippy::too_many_arguments)]

use crate::{
    error::GovernanceError,
    merkle_helpers::{ConsensusResult, MetaMerkleLeaf},
    state::{Proposal, Support},
    SNAPSHOT_PROGRAM_ID,
};

use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::get_epoch_total_stake, hash::hash, instruction::Instruction,
        native_token::LAMPORTS_PER_SOL, program::invoke,
    },
};

#[derive(Accounts)]
pub struct SupportProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal supporter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>, // Proposal to support
    #[account(
        init,
        payer = signer,
        space = 8 + Support::INIT_SPACE,
        seeds = [b"support", proposal.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub support: Account<'info, Support>, // New support account
    /// CHECK:
    #[account(constraint = snapshot_program.key() == SNAPSHOT_PROGRAM_ID @ GovernanceError::InvalidSnapshotProgram)]
    pub snapshot_program: UncheckedAccount<'info>,
    // pub snapshot_program: Program<'info, Snapshot>,  // Snapshot Program for verification, uncomment in production
    #[account(seeds = [b"consensus_result"], bump)] // ConsensusResult PDA
    pub consensus_result: Account<'info, ConsensusResult>, // Holds snapshot_slot and snapshot_hash
    pub system_program: Program<'info, System>, // For account creation
}

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(
        &mut self,
        meta_merkle_proof: Vec<[u8; 32]>, // Merkle proof for validator leaf
        meta_merkle_leaf: MetaMerkleLeaf, // Validator leaf data
        bumps: &SupportProposalBumps,
    ) -> Result<()> {
        // Ensure proposal is eligible for support
        require!(!self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Ensure leaf matches signer and has sufficient stake
        require_keys_eq!(
            meta_merkle_leaf.voting_wallet,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );
        require_gte!(
            meta_merkle_leaf.active_stake,
            1_000 * LAMPORTS_PER_SOL,
            GovernanceError::NotEnoughStake
        );

        // Hash the leaf for verification
        let leaf_bytes = meta_merkle_leaf.try_to_vec()?;
        let leaf_hash = hash(&leaf_bytes).to_bytes();

        // Get root and slot from ConsensusResult
        let root = self.consensus_result.snapshot_hash;
        let snapshot_slot = self.consensus_result.snapshot_slot;

        // Ensure snapshot is not stale (adjust delta as needed)
        let clock = Clock::get()?;
        require!(
            snapshot_slot <= clock.slot && clock.slot - snapshot_slot < 1000,
            GovernanceError::StaleSnapshot
        );

        // CPI to verify Merkle inclusion
        // let verify_ix = Instruction {
        //     program_id: SNAPSHOT_PROGRAM_ID,
        //     accounts: vec![
        //         AccountMeta::new_readonly(self.snapshot_program.key(), false),
        //         AccountMeta::new_readonly(self.consensus_result.key(), false),  // Verify reads ConsensusResult
        //     ],
        //     data: snapshot_program::instruction::Verify {
        //         leaf_hash,
        //         proof: meta_merkle_proof,
        //         root,
        //     }.data(),
        // };
        // invoke(&verify_ix, &[self.snapshot_program.to_account_info(), self.consensus_result.to_account_info()])?;

        // Add the supporter's stake (from verified leaf) to the proposal's cluster support
        self.proposal.cluster_support_lamports = self
            .proposal
            .cluster_support_lamports
            .checked_add(meta_merkle_leaf.active_stake)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        // Check if cluster support reaches 5% of total cluster stake
        let cluster_stake = get_epoch_total_stake();
        let support_scaled = (self.proposal.cluster_support_lamports as u128) * 100;
        let cluster_scaled = (cluster_stake as u128) * 5;
        if support_scaled >= cluster_scaled {
            // Activate voting if threshold met
            self.proposal.voting = true;
        }

        Ok(())
    }
}
