use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub author: Pubkey,
    #[max_len(50)]
    pub title: String,
    #[max_len(250)]
    pub description: String,
    // Epoch got from sysvar at creation
    pub creation_epoch: u64,
    pub start_epoch: u64,
    pub end_epoch: u64,
    pub proposer_stake_weight_bp: u64,
    // Cluster support will accumulate support points until vote is enabled
    pub cluster_support_bp: u64,
    pub for_votes_bp: u64,
    pub against_votes_bp: u64,
    pub abstain_votes_bp: u64,
    pub closed: bool,
    pub finalized: bool,
    pub proposal_bump: u8,
}
