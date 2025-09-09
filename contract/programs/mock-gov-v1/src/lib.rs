#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

mod instructions;
mod state;

use instructions::*;
use state::*;

declare_id!("65smeZTDVuVRQZ1zdUF8wXRMDXhAMVTxRbV3n3MyXLPJ");

#[program]
pub mod mock_gov_v1 {
    use super::*;

    pub fn create_consensus_result(
        ctx: Context<CreateConsensusResult>,
        ballot_id: u64,
        meta_merkle_root: [u8; 32],
        snapshot_hash: [u8; 32],
    ) -> Result<()> {
        ctx.accounts.create_consensus_result(ballot_id, meta_merkle_root, snapshot_hash )?;
        Ok(())
    }

    pub fn init_meta_merkle_proof(
        ctx: Context<InitMetaMerkleProof>,
        meta_merkle_leaf: MetaMerkleLeaf,
        meta_merkle_proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        ctx.accounts.init_meta_merkle_proof(meta_merkle_leaf, meta_merkle_proof)?;
        Ok(())
    }

    pub fn verify_merkle_proof(
        ctx: Context<VerifyMerkleProof>,
        stake_proof: Option<Vec<[u8; 32]>>,
        stake_leaf: Option<StakeMerkleLeaf>,
    ) -> Result<()> {
        ctx.accounts.verify_merkle_proof(stake_proof, stake_leaf)?;
        Ok(())
    }

    pub fn close_meta_merkle_proof(
        ctx: Context<CloseMetaMerkleProof>,
    ) -> Result<()> {
        ctx.accounts.close_meta_merkle_proof()?;
        Ok(())
    }
}
