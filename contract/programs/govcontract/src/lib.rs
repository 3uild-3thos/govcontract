#![allow(unexpected_cfgs, unused_variables)]
mod error;
mod instructions;
mod state;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;

declare_id!("GoVpHPV3EY89hwKJjfw19jTdgMsGKG4UFSE2SfJqTuhc");

#[program]
pub mod govcontract {
    use super::*;

    pub fn initialize_index(ctx: Context<InitializedIndex>) -> Result<()> {
        ctx.accounts.init_index(&ctx.bumps)?;
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        seed: u64,
        title: String,
        description: String,
        start_epoch: u64,
        voting_length_epochs: u64,
    ) -> Result<()> {
        ctx.accounts.create_proposal(
            title,
            description,
            start_epoch,
            voting_length_epochs,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn support_proposal(ctx: Context<SupportProposal>) -> Result<()> {
        ctx.accounts.support_proposal(&ctx.bumps)?;
        Ok(())
    }

    // pub fn modify_proposal(ctx: Context<CreateProposal>) -> Result<()> {
    //     msg!("Greetings from: {:?}", ctx.program_id);
    //     Ok(())
    // }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
    ) -> Result<()> {
        ctx.accounts
            .cast_vote(for_votes_bp, against_votes_bp, abstain_votes_bp, &ctx.bumps)?;
        Ok(())
    }

    pub fn modify_vote(
        ctx: Context<ModifyVote>,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
    ) -> Result<()> {
        ctx.accounts
            .modify_vote(for_votes_bp, against_votes_bp, abstain_votes_bp)?;
        Ok(())
    }

    pub fn tally_votes<'info>(
        ctx: Context<'_, '_, 'info, 'info, TallyVotes<'info>>,
        finalize: bool,
    ) -> Result<()> {
        ctx.accounts.tally_votes(ctx.remaining_accounts, finalize)?;

        Ok(())
    }
}
