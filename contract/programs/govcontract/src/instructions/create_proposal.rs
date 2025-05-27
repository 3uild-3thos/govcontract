use anchor_lang::prelude::*;
use anchor_lang::solana_program::epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake};

use crate::{error::GovernanceError, stake_weight_bp, state::Proposal};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        seeds = [b"proposal", seed.to_le_bytes().as_ref(), &signer.key.to_bytes()],
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
        end_epoch: u64,
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

        // Get cluster stake syscall 
        let cluster_stake = get_epoch_total_stake();
        
        // Get proposal creator stake
        let proposer_stake = get_epoch_stake_for_vote_account(self.signer.key);

        // RFP:Only staked validators with at least 40k can submit a proposal to be considered for voting
        require!(proposer_stake > 40_000u64, GovernanceError::NotEnoughStake);

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;

        // Add proposer stake weight to support weight??
        let proposer_stake_weight_bp = stake_weight_bp!(proposer_stake, cluster_stake)?;

        self.proposal.set_inner(Proposal {
            author: self.signer.key(),
            title,
            description,
            creation_epoch: current_epoch,
            start_epoch,
            end_epoch,
            proposer_stake_weight_bp,
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
