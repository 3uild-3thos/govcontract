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
    #[account(mut)]
    pub ballot_box: UncheckedAccount<'info>,

    /// CHECK: Ballot program account
    #[account(
        constraint = ballot_program.key == &gov_v1::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub ballot_program: UncheckedAccount<'info>,

    /// CHECK: Program config account
    #[account(
        seeds = [b"ProgramConfig"],
        bump,
        seeds::program = ballot_program.key(),
        constraint = program_config.owner == &gov_v1::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub program_config: UncheckedAccount<'info>,

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

        require!(
            clock.epoch == self.proposal.creation_epoch + MAX_SUPPORT_EPOCHS,
            GovernanceError::NotInSupportPeriod
        );

        // assuming this returns in lamports
        let supporter_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);

        let proposal_account = &mut self.proposal;
        let new_support_stake = proposal_account
            .cluster_support_lamports
            .checked_add(supporter_stake)
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        // update the cluster support
        proposal_account.cluster_support_lamports = new_support_stake;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: proposal_account.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        let cluster_stake = get_epoch_total_stake();

        let cluster_min_stake = cluster_stake
            .checked_mul(CLUSTER_SUPPORT_PCT_MIN)
            .and_then(|v| v.checked_div(100))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        let mut current_voting_emit = proposal_account.voting;
        let mut snapshot_slot = 0;
        proposal_account.voting = if new_support_stake >= cluster_min_stake {
            // this is for emit checks
            current_voting_emit = true;
            let (start_slot, _) =
                get_epoch_slot_range(clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION);
            snapshot_slot = start_slot + 1000;
            // start voting 1 epoch after snapshot
            // checking in any vote or others is start_epoch <= current_epoch < end_epoch
            proposal_account.start_epoch =
                clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION + 1;
            proposal_account.end_epoch =
                clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION + 1 + VOTING_EPOCHS;
            proposal_account.snapshot_slot = snapshot_slot; // 1000 slots into snapshot

            let (consensus_result_pda, _) = Pubkey::find_program_address(
                &[b"ConsensusResult", &snapshot_slot.to_le_bytes()],
                &self.ballot_program.key,
            );

            proposal_account.consensus_result = Some(consensus_result_pda);

            if self.ballot_box.data_is_empty() {
                // Create seed components with sufficient lifetime
                let proposal_seed_val = proposal_account.proposal_seed.to_le_bytes();
                let vote_account_key = proposal_account.vote_account_pubkey.key();

                let seeds: &[&[u8]] = &[
                    b"proposal".as_ref(),
                    &proposal_seed_val,
                    vote_account_key.as_ref(),
                    &[proposal_account.proposal_bump],
                ];
                let signer_seeds = &[&seeds[..]];

                let cpi_ctx = CpiContext::new_with_signer(
                    self.ballot_program.to_account_info(),
                    gov_v1::cpi::accounts::InitBallotBox {
                        payer: self.signer.to_account_info(),
                        proposal: proposal_account.to_account_info(),
                        ballot_box: self.ballot_box.to_account_info(),
                        program_config: self.program_config.to_account_info(),
                        system_program: self.system_program.to_account_info(),
                    },
                    signer_seeds,
                );
                gov_v1::cpi::init_ballot_box(
                    cpi_ctx,
                    snapshot_slot,
                    proposal_account.proposal_seed,
                    proposal_account.vote_account_pubkey,
                )?;
            }

            true
        } else {
            false
        };

        emit!(ProposalSupported {
            proposal_id: self.proposal.key(),
            supporter: self.signer.key(),
            cluster_support_lamports: new_support_stake,
            voting_activated: current_voting_emit,
            snapshot_slot: snapshot_slot,
        });

        Ok(())
    }
}
