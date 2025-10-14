// https://github.com/exo-tech-xyz/gov-v1/blob/main/programs/gov-v1/src/state/proof.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct MetaMerkleLeaf {
    /// Wallet designated for governance voting for the vote account.
    pub voting_wallet: Pubkey,
    /// Validator's vote account.
    pub vote_account: Pubkey,
    /// Root hash of the StakeMerkleTree, representing all active stake accounts
    /// delegated to the current vote account.
    pub stake_merkle_root: [u8; 32],
    /// Total active delegated stake under this vote account.
    pub active_stake: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct StakeMerkleLeaf {
    /// Wallet designated for governance voting for the stake account.
    pub voting_wallet: Pubkey,
    /// The stake account address.
    pub stake_account: Pubkey,
    /// Active delegated stake amount.
    pub active_stake: u64,
}
