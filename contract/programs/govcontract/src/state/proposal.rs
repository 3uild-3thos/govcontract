use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace, Default)]
pub struct Proposal {
    /// The public key of the validator who created this proposal
    pub author: Pubkey,
    #[max_len(50)]
    pub title: String,
    #[max_len(250)]
    pub description: String,
    pub creation_epoch: u64,
    pub start_epoch: u64,
    pub end_epoch: u64,
    pub proposer_stake_weight_bp: u64,
    pub cluster_support_lamports: u64,
    /// Total lamports voted in favor of this proposal
    pub for_votes_lamports: u64,
    /// Total lamports voted against this proposal
    pub against_votes_lamports: u64,
    /// Total lamports that abstained from voting on this proposal
    pub abstain_votes_lamports: u64,
    pub voting: bool,
    pub finalized: bool,
    pub proposal_bump: u8,
    pub creation_timestamp: i64,
    pub vote_count: u32,
    pub index: u32,
    /// Merkle root hash representing the snapshot of validator stakes at proposal creation
    pub merkle_root_hash: Option<[u8;32]>,
    /// Slot number when the validator stake snapshot was taken
    pub snapshot_slot: u64,
}
