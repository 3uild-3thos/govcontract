use anchor_lang::{prelude::*, solana_program::epoch_stake::get_epoch_total_stake};

use crate::{
    constants::*,
    error::GovernanceError,
    events::ProposalSupported,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Support},
};

#[cfg(feature = "production")]
use gov_v1::{ConsensusResult, MetaMerkleProof, ID as GOV_V1_ID};
#[cfg(feature = "testing")]
use mock_gov_v1::{ConsensusResult, MetaMerkleProof, ID as GOV_V1_ID};

#[derive(Accounts)]
#[instruction(spl_vote_account: Pubkey)]
pub struct SupportProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal supporter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = 8 + Support::INIT_SPACE,
        seeds = [b"support", proposal.key().as_ref(), spl_vote_account.as_ref()],
        bump
    )]
    pub support: Account<'info, Support>, // New support account
    /// CHECK: The snapshot program (gov-v1 or mock)
    #[account(
        constraint = snapshot_program.key == &GOV_V1_ID @ GovernanceError::InvalidSnapshotProgram
    )]
    pub snapshot_program: UncheckedAccount<'info>,
    pub consensus_result: Account<'info, ConsensusResult>,
    pub meta_merkle_proof: Account<'info, MetaMerkleProof>,
    pub system_program: Program<'info, System>,
}

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(
        &mut self,
        spl_vote_account: Pubkey,
        bumps: &SupportProposalBumps,
    ) -> Result<()> {
        // Ensure proposal is eligible for support
        require!(!self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        require!(
            self.consensus_result.ballot.meta_merkle_root
                == self.proposal.meta_merkle_root.unwrap_or_default(),
            GovernanceError::InvalidMerkleRoot
        );

        let meta_merkle_leaf = &self.meta_merkle_proof.meta_merkle_leaf;

        // Crosscheck consensus result
        require_eq!(
            self.meta_merkle_proof.consensus_result,
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
            self.proposal.voting = true;
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
