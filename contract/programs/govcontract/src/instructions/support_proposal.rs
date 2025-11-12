use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{program as vote_program, state::VoteState},
    },
};

use crate::{
    constants::*,
    error::GovernanceError,
    events::ProposalSupported,
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

    /// CHECK: Ballot box account - may or may not exist, checked with data_is_empty()
    pub ballot_box: UncheckedAccount<'info>,

    /// CHECK: Ballot program account
    #[account(
        constraint = ballot_program.key == &gov_v1::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub ballot_program: UncheckedAccount<'info>,

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
                get_epoch_slot_range(clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION);
            let snapshot_slot = start_slot + 1000;
            // start voting 1 epoch after snapshot
            // checking in any vote or others is start_epoch <= current_epoch < end_epoch
            self.proposal.start_epoch =
                clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION + 1;
            self.proposal.end_epoch =
                clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION + 1 + VOTING_EPOCHS;
            self.proposal.snapshot_slot = snapshot_slot; // 1000 slots into snapshot

            let (consensus_result_pda, _) = Pubkey::find_program_address(
                &[b"ConsensusResult", &snapshot_slot.to_le_bytes()],
                &self.ballot_program.key,
            );

            self.proposal.consensus_result = Some(consensus_result_pda);

            if self.ballot_box.data_is_empty() {
                // Create seed components with sufficient lifetime
                let proposal_seed_val = self.proposal.proposal_seed.to_le_bytes();
                let vote_account_key = self.proposal.vote_account_pubkey.key();
                let seeds: &[&[u8]] = &[
                    b"proposal".as_ref(),
                    &proposal_seed_val,
                    vote_account_key.as_ref(),
                ];
                let signer = &[&seeds[..]];
                // Initialize the consensus result
                let cpi_ctx = CpiContext::new_with_signer(
                    self.ballot_program.to_account_info(),
                    gov_v1::cpi::accounts::InitBallotBox {
                        payer: self.signer.to_account_info(),
                        proposal: self.proposal.to_account_info(),
                        ballot_box: self.ballot_box.to_account_info(),
                        program_config: self.ballot_program.to_account_info(),
                        system_program: self.system_program.to_account_info(),
                    },
                    signer,
                );

                gov_v1::cpi::init_ballot_box(
                    cpi_ctx,
                    snapshot_slot,
                    self.proposal.proposal_seed, // we are not storing this
                    self.spl_vote_account.key(),
                )?;
            }

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
