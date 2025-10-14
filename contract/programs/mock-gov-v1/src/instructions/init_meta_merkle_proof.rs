use crate::state::{ConsensusResult, MetaMerkleLeaf, MetaMerkleProof};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(leaf: MetaMerkleLeaf, proof: Vec<[u8; 32]>)]
pub struct InitMetaMerkleProof<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + MetaMerkleProof::init_space(&proof),
        seeds = [b"MetaMerkleProof", consensus_result.key().as_ref(), leaf.vote_account.as_ref()],
        bump
    )]
    pub meta_merkle_proof: Box<Account<'info, MetaMerkleProof>>,
    pub consensus_result: Box<Account<'info, ConsensusResult>>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitMetaMerkleProof<'info> {
    pub fn init_meta_merkle_proof(
        &mut self,
        leaf: MetaMerkleLeaf,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        let meta_proof = &mut self.meta_merkle_proof;
        meta_proof.meta_merkle_leaf = leaf;
        meta_proof.meta_merkle_proof = proof;
        meta_proof.payer = self.payer.key();
        meta_proof.consensus_result = self.consensus_result.key();
        meta_proof.close_timestamp = 0;
        Ok(())
    }
}
