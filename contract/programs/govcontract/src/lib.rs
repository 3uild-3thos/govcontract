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

declare_id!("3GBS7ZjQV5cKfsazbA2CSGm8kVQjjT6ow9XxZtSxRH3G");

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
    ) -> Result<()> {
        ctx.accounts
            .create_proposal(title, description, &ctx.bumps)?;
        Ok(())
    }

    pub fn support_proposal(ctx: Context<SupportProposal>) -> Result<()> {
        ctx.accounts.support_proposal(&ctx.bumps)?;
        Ok(())
    }

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

    pub fn cast_vote_override(
        ctx: Context<CastVoteOverride>,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        stake_merkle_proof: Vec<[u8; 32]>,
        stake_merkle_leaf: StakeMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts.cast_vote_override(
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            stake_merkle_proof,
            stake_merkle_leaf,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn modify_vote_override(
        ctx: Context<ModifyVoteOverride>,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        stake_merkle_proof: Vec<[u8; 32]>,
        stake_merkle_leaf: StakeMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts.modify_vote_override(
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            stake_merkle_proof,
            stake_merkle_leaf,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn add_merkle_root(
        ctx: Context<AddMerkleRoot>,
        ballot_id: u64,
        merkle_root: [u8; 32],
    ) -> Result<()> {
        ctx.accounts.add_merkle_root(ballot_id, merkle_root)?;
        Ok(())
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        ctx.accounts.finalize_proposal()?;

        Ok(())
    }

    pub fn adjust_epochs(
        ctx: Context<AdjustEpochs>,
        creation_epoch: Option<u64>,
        start_epoch: Option<u64>,
        end_epoch: Option<u64>,
    ) -> Result<()> {
        ctx.accounts
            .adjust_epochs(creation_epoch, start_epoch, end_epoch)?;
        Ok(())
    }
}
