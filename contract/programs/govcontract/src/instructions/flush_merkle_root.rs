use anchor_lang::prelude::*;

use crate::{
    constants::*, error::GovernanceError, events::MerkleRootFlushed, state::Proposal,
    utils::get_epoch_slot_range,
};

#[derive(Accounts)]
pub struct FlushMerkleRoot<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal author
    #[account(
        mut,
        constraint = proposal.author == signer.key() @ GovernanceError::Unauthorized,
        constraint = !proposal.finalized @ GovernanceError::ProposalFinalized,
    )]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> FlushMerkleRoot<'info> {
    pub fn flush_merkle_root(&mut self) -> Result<()> {
        let clock = Clock::get()?;

        // TOOD: Missing CPI
        // Clear the consensus_result
        self.proposal.consensus_result = None;

        // Recalculate snapshot_slot based on current epoch
        // Using the same logic as in support_proposal
        let target_epoch = clock.epoch + SNAPSHOT_EPOCH_EXTENSION;
        let (start_slot, _) = get_epoch_slot_range(target_epoch);
        // 1000 slots into snapshot
        self.proposal.snapshot_slot = start_slot + 1000;
        // start voting 1 epoch after snapshot
        self.proposal.start_epoch = target_epoch + 1;
        self.proposal.end_epoch = target_epoch + 1 + VOTING_EPOCHS;
        emit!(MerkleRootFlushed {
            proposal_id: self.proposal.key(),
            author: self.signer.key(),
            new_snapshot_slot: self.proposal.snapshot_slot,
            flush_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}
