use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh0_10::try_from_slice_unchecked,
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{program as vote_program, state::VoteState},
    },
};

#[cfg(feature = "production")]
use gov_v1::{ConsensusResult, MetaMerkleProof};
#[cfg(feature = "testing")]
use mock_gov_v1::{ConsensusResult, MetaMerkleProof};

use crate::{
    constants::*,
    error::GovernanceError,
    events::ProposalSupported,
    merkle_helpers::verify_merkle_proof_cpi,
    state::{Proposal, Support},
    utils::get_epoch_slot_range,
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
        space = ANCHOR_DISCRIMINATOR + Support::INIT_SPACE,
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

    pub system_program: Program<'info, System>,
}

impl<'info> SupportProposal<'info> {
    pub fn support_proposal(&mut self, bumps: &SupportProposalBumps) -> Result<()> {
        let clock = Clock::get()?;

        // Ensure proposal is eligible for support
        require!(
            self.proposal.voting == false && self.proposal.finalized == false,
            GovernanceError::ProposalClosed
        );
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        require!(
            clock.epoch == self.proposal.creation_epoch + MAX_SUPPORT_EPOCHS,
            GovernanceError::SupportPeriodExpired
        );

        // assuming this returns in lamports
        let supporter_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);

        // Add the supporter's stake (from verified leaf) to the proposal's cluster support
        self.proposal.add_cluster_support(supporter_stake)?;

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
        self.proposal.voting = if support_scaled >= cluster_scaled {
            let (start_slot, _) =
                get_epoch_slot_range(clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_SLOT);
            self.proposal.start_epoch = clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_SLOT;
            self.proposal.end_epoch = self.proposal.start_epoch + VOTING_EPOCHS;
            self.proposal.snapshot_slot = start_slot + 1000; // 1000 slots into snapshot
            true
        } else {
            false
        };

        emit!(ProposalSupported {
            proposal_id: self.proposal.key(),
            supporter: self.signer.key(),
            cluster_support_lamports: self.proposal.cluster_support_lamports,
            voting_activated: self.proposal.voting,
            snapshot_slot: self.proposal.snapshot_slot,
        });

        Ok(())
    }
}
