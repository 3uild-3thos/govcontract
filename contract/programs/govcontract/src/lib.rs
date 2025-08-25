#![allow(unexpected_cfgs, unused_variables)]
mod error;
mod instructions;
mod merkle_helpers;
mod state;
mod utils;
use anchor_lang::prelude::*;
use instructions::*;
use merkle_helpers::{MetaMerkleLeaf, StakeMerkleLeaf};

declare_id!("GoVpHPV3EY89hwKJjfw19jTdgMsGKG4UFSE2SfJqTuhc");

// Snapshot Program ID - replace with actual program ID when deployed
pub const SNAPSHOT_PROGRAM_ID: Pubkey = pubkey!("Snapshot11111111111111111111111111111111111");

#[program]
pub mod govcontract {
    use crate::merkle_helpers::StakeMerkleLeaf;

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
        meta_merkle_proof: Vec<[u8; 32]>,
        meta_merkle_leaf: MetaMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts.create_proposal(
            title,
            description,
            start_epoch,
            voting_length_epochs,
            meta_merkle_proof,
            meta_merkle_leaf,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn support_proposal(
        ctx: Context<SupportProposal>,
        proposal_id: u64,
        meta_merkle_proof: Vec<[u8; 32]>,
        meta_merkle_leaf: MetaMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts
            .support_proposal(meta_merkle_proof, meta_merkle_leaf, &ctx.bumps)?;
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
        meta_merkle_proof: Vec<[u8; 32]>,
        meta_merkle_leaf: MetaMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts.cast_vote(
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            meta_merkle_proof,
            meta_merkle_leaf,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn modify_vote(
        ctx: Context<ModifyVote>,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        meta_merkle_proof: Vec<[u8; 32]>,
        meta_merkle_leaf: MetaMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts
            .modify_vote(for_votes_bp, against_votes_bp, abstain_votes_bp, meta_merkle_proof, meta_merkle_leaf)?;
        Ok(())
    }

    pub fn cast_vote_override(
        ctx: Context<CastVoteOverride>,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        stake_merkle_proof: Vec<[u8; 32]>,
        stake_merkle_leaf: StakeMerkleLeaf,
        meta_merkle_proof: Vec<[u8; 32]>,
        meta_merkle_leaf: MetaMerkleLeaf,
    ) -> Result<()> {
        ctx.accounts.cast_vote_override(
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            stake_merkle_proof,
            stake_merkle_leaf,
            meta_merkle_proof,
            meta_merkle_leaf,
            &ctx.bumps,
        )?;
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
