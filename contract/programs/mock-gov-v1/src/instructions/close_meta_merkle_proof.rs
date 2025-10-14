use crate::state::MetaMerkleProof;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseMetaMerkleProof<'info> {
    #[account(
        mut,
        close = payer
    )]
    pub meta_merkle_proof: Box<Account<'info, MetaMerkleProof>>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

impl<'info> CloseMetaMerkleProof<'info> {
    pub fn close_meta_merkle_proof(&mut self) -> Result<()> {
        Ok(())
    }
}
