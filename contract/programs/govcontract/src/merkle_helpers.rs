use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetaMerkleLeaf {
    pub voting_wallet: Pubkey,
    pub vote_account: Pubkey,
    pub stake_merkle_root: [u8; 32],
    pub active_stake: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct StakeMerkleLeaf {
    /// Wallet designated for governance voting for the stake account.
    pub voting_wallet: Pubkey,
    /// The stake account address.
    pub stake_account: Pubkey,
    /// Active delegated stake amount.
    pub active_stake: u64,
}

#[account]
pub struct ConsensusResult {
    pub snapshot_slot: u64,
    pub snapshot_hash: [u8; 32],
}