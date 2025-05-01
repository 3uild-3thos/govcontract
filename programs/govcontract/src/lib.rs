#![allow(unexpected_cfgs)]
mod error;
mod instructions;
mod state;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;

declare_id!("5BU5KsgU7dpLj6t9tZWy7297rLvpfVHhdTkQrx1MJJ2x");

#[program]
pub mod govcontract {
    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        _seed: u64,
        title: String,
        description: String,
        start_epoch: u64,
        end_epoch: u64,
    ) -> Result<()> {
        ctx.accounts
            .create_proposal(title, description, start_epoch, end_epoch, &ctx.bumps)?;
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
        // proposal_id: Pubkey,
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

    // pub fn remove_vote(ctx: Context<ModifyVote>) -> Result<()> {
    //     msg!("Greetings from: {:?}", ctx.program_id);
    //     Ok(())
    // }

    pub fn tally_votes<'info>(ctx: Context<'_, '_, 'info, 'info, TallyVotes<'info>>) -> Result<()> {
        // let remaining_accounts = ctx.remaining_accounts;
        ctx.accounts.tally_votes(ctx.remaining_accounts)?;
        // for account in remaining_accounts.iter() {
        //     let vote: Account<Vote> = Account::try_from(account)?;
        //     ctx.accounts.tally_votes(&vote)?
        // }
        // Must validate current stake weight on votes querying the sysvar for all stake and validator stake
        Ok(())
    }
}
