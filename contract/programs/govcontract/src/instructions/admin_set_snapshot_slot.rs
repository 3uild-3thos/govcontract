use anchor_lang::prelude::*;

use crate::{error::GovernanceError, state::Proposal};

/// Admin-only (proposal-author-only) instruction to manually set the proposal snapshot slot
/// and ensure the corresponding gov-v1 BallotBox is initialized via CPI.
#[derive(Accounts)]
#[instruction(snapshot_slot: u64)]
pub struct AdminSetSnapshotSlot<'info> {
    /// Proposal author pays CPI account creation fees
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = proposal.author == signer.key() @ GovernanceError::Unauthorized,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
    )]
    pub proposal: Account<'info, Proposal>,

    /// CHECK: gov-v1 BallotBox PDA for `snapshot_slot` (may or may not exist).
    #[account(
        mut,
        seeds = [b"BallotBox".as_ref(), snapshot_slot.to_le_bytes().as_ref()],
        bump,
        seeds::program = ballot_program.key(),
    )]
    pub ballot_box: UncheckedAccount<'info>,

    /// CHECK: gov-v1 program
    #[account(constraint = ballot_program.key == &gov_v1::ID @ ProgramError::InvalidAccountOwner)]
    pub ballot_program: UncheckedAccount<'info>,

    /// CHECK: gov-v1 ProgramConfig PDA
    #[account(
        seeds = [b"ProgramConfig"],
        bump,
        seeds::program = ballot_program.key(),
        constraint = program_config.owner == &gov_v1::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub program_config: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> AdminSetSnapshotSlot<'info> {
    pub fn admin_set_snapshot_slot(
        &mut self,
        snapshot_slot: u64,
        bumps: &AdminSetSnapshotSlotBumps,
    ) -> Result<()> {
        let clock = Clock::get()?;

        require!(snapshot_slot > 0, GovernanceError::InvalidSnapshotSlot);

        // Update snapshot slot and derived consensus result PDA
        self.proposal.snapshot_slot = snapshot_slot;
        let (consensus_result_pda, _) = Pubkey::find_program_address(
            &[b"ConsensusResult", &snapshot_slot.to_le_bytes()],
            &self.ballot_program.key,
        );
        self.proposal.consensus_result = Some(consensus_result_pda);
        
        // Initialize BallotBox in gov-v1 if it doesn't exist yet
        if self.ballot_box.data_is_empty() {
            let proposal_seed_val = self.proposal.proposal_seed.to_le_bytes();
            let vote_account_key = self.proposal.vote_account_pubkey.key();

            let seeds: &[&[u8]] = &[
                b"proposal".as_ref(),
                &proposal_seed_val,
                vote_account_key.as_ref(),
                &[self.proposal.proposal_bump],
            ];
            let signer_seeds = &[&seeds[..]];

            let cpi_ctx = CpiContext::new_with_signer(
                self.ballot_program.to_account_info(),
                gov_v1::cpi::accounts::InitBallotBox {
                    payer: self.signer.to_account_info(),
                    proposal: self.proposal.to_account_info(),
                    ballot_box: self.ballot_box.to_account_info(),
                    program_config: self.program_config.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                signer_seeds,
            );

            gov_v1::cpi::init_ballot_box(
                cpi_ctx,
                snapshot_slot,
                self.proposal.proposal_seed,
                self.proposal.vote_account_pubkey,
            )?;
        }

        // Silence unused warning in older compilers; bumps are still part of the Anchor API.
        let _ = bumps;

        Ok(())
    }
}
