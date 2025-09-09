use crate::state::{Ballot, ConsensusResult};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(ballot_id: u64)]
pub struct CreateConsensusResult<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + ConsensusResult::INIT_SPACE,
        seeds = [b"ConsensusResult".as_ref(), &ballot_id.to_le_bytes()],
        bump
    )]
    pub consensus_result: Box<Account<'info, ConsensusResult>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateConsensusResult<'info> {
    pub fn create_consensus_result(
        &mut self,
        ballot_id: u64,
        meta_merkle_root: [u8; 32],
        snapshot_hash: [u8; 32],
    ) -> Result<()> {
        let consensus = &mut self.consensus_result;
        consensus.ballot_id = ballot_id;
        consensus.ballot = Ballot {
            meta_merkle_root,
            snapshot_hash,
        };
        Ok(())
    }
}
