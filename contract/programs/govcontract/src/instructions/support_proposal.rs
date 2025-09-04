use anchor_lang::{
    prelude::*,
    solana_program::epoch_stake::get_epoch_total_stake,
};

use gov_v1::{MetaMerkleProof, ID as SNAPSHOT_PROGRAM_ID};

use crate::{
    error::GovernanceError,
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
        seeds = [b"support", proposal.key().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub support: Account<'info, Support>, // New support account
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

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(
        &mut self,
        bumps: &SupportProposalBumps,
    ) -> Result<()> {
        // Ensure proposal is eligible for support
        require!(!self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

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

        let clock = Clock::get()?;

        verify_merkle_proof_cpi(
            &self.meta_merkle_proof.to_account_info(),
            &self.consensus_result.to_account_info(),
            &self.snapshot_program.to_account_info(),
            None,
            None,
        )?;

        // Add the supporter's stake (from verified leaf) to the proposal's cluster support
        self.proposal.add_cluster_support(meta_merkle_leaf.active_stake)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });


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
