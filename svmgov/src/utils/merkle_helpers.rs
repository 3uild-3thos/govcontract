use anchor_lang::{AnchorDeserialize, AnchorSerialize};

// Mirroring MetaMerkleLeaf
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetaMerkleLeaf {
    pub voting_wallet: String,       // base58 Pubkey
    pub vote_account: String,        // base58 Pubkey
    pub stake_merkle_root: String,   // base58 [u8;32]
    pub active_stake: u64,           // lamports
}