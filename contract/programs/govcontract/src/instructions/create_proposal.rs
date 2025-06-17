use anchor_lang::prelude::*;
use anchor_lang::solana_program::epoch_stake::{
    get_epoch_stake_for_vote_account, get_epoch_total_stake,
};
use anchor_lang::solana_program::vote::{program as vote_program, state::VoteState};

use crate::{error::GovernanceError, stake_weight_bp, state::Proposal};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK:
    pub validator: AccountInfo<'info>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() >= VoteState::size_of()
    )]
    pub spl_vote_account: AccountInfo<'info>,
    #[account(
        init,
        payer = signer,
        // seeds = [b"proposal", seed.to_le_bytes().as_ref(), &signer.key.to_bytes()],
        seeds = [b"proposal", seed.to_le_bytes().as_ref(), &validator.key.to_bytes()],
        bump,
        space = Proposal::INIT_SPACE,
    )]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        start_epoch: u64,
        voting_length_epochs: u64,
        bumps: &CreateProposalBumps,
    ) -> Result<()> {
        require!(title.len() <= 50, GovernanceError::TitleTooLong);

        require!(
            description.len() <= 250,
            GovernanceError::DescriptionTooLong
        );

        require!(
            description.starts_with("https://github.com"),
            GovernanceError::DescriptionInvalid
        );

        // 4 bytes discriminant, 32 bytes node_pubkey
        let node_pubkey = Pubkey::try_from(&self.spl_vote_account.data.borrow()[4..36])
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        // Validator identity must be part of the Vote account
        require_keys_eq!(
            node_pubkey,
            // self.signer.key(),
            self.validator.key(),
            GovernanceError::InvalidVoteAccount
        );

        // Get cluster stake syscall
        let cluster_stake = get_epoch_total_stake();
        msg!("Epoch stake {}", cluster_stake);
        // Get proposal creator stake
        let proposer_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);

        // RFP:Only staked validators with at least 40k can submit a proposal to be considered for voting
        msg!("Validator stake {}", proposer_stake);
        require!(proposer_stake > 40_000u64, GovernanceError::NotEnoughStake);

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;

        // Add proposer stake weight to support weight??
        let proposer_stake_weight_bp =
            stake_weight_bp!(proposer_stake as u128, cluster_stake as u128)?;

        self.proposal.set_inner(Proposal {
            // author: self.signer.key(),
            author: self.validator.key(),
            title,
            description,
            creation_epoch: current_epoch,
            start_epoch,
            end_epoch: start_epoch
                .checked_add(voting_length_epochs)
                .ok_or(ProgramError::ArithmeticOverflow)?,
            proposer_stake_weight_bp: proposer_stake_weight_bp.try_into()?,
            cluster_support_bp: 0,
            for_votes_bp: 0,
            against_votes_bp: 0,
            abstain_votes_bp: 0,
            voting: false,
            finalized: false,
            proposal_bump: bumps.proposal,
        });

        Ok(())
    }
}
