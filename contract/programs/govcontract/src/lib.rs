#![allow(unexpected_cfgs, unused_variables, clippy::too_many_arguments)]
mod constants;
mod error;
mod events;
mod instructions;
mod merkle_helpers;
mod state;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;

#[cfg(feature = "production")]
use gov_v1::StakeMerkleLeaf;
#[cfg(feature = "testing")]
use mock_gov_v1::StakeMerkleLeaf;

// declare_id!("GoVpHPV3EY89hwKJjfw19jTdgMsGKG4UFSE2SfJqTuhc");
declare_id!("AXnkQnEEMBsKcJ1gSXP1aW6tZMGWodzEaoB6b3bRib2r");

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

    pub fn support_proposal(ctx: Context<SupportProposal>, spl_vote_account: Pubkey) -> Result<()> {
        ctx.accounts
            .support_proposal(spl_vote_account, &ctx.bumps)?;
        Ok(())
    }

    // pub fn modify_proposal(ctx: Context<CreateProposal>) -> Result<()> {
    //     msg!("Greetings from: {:?}", ctx.program_id);
    //     Ok(())
    // }

    pub fn cast_vote(
        ctx: Context<CastVote>,
        spl_vote_account: Pubkey,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
    ) -> Result<()> {
        ctx.accounts.cast_vote(
            spl_vote_account,
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn modify_vote(
        ctx: Context<ModifyVote>,
        spl_vote_account: Pubkey,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
    ) -> Result<()> {
        ctx.accounts.modify_vote(
            spl_vote_account,
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn cast_vote_override(
        ctx: Context<CastVoteOverride>,
        spl_vote_account: Pubkey,
        spl_stake_account: Pubkey,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        stake_merkle_proof: Vec<[u8; 32]>,
        stake_merkle_leaf: StakeMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts.cast_vote_override(
            spl_vote_account,
            spl_stake_account,
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            stake_merkle_proof,
            stake_merkle_leaf,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn add_merkle_root(ctx: Context<AddMerkleRoot>) -> Result<()> {
        ctx.accounts.add_merkle_root()?;
        Ok(())
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        ctx.accounts.finalize_proposal()?;

        Ok(())
    }
}
