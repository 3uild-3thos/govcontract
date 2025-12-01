// String length limits
pub const MAX_TITLE_LENGTH: usize = 50;
pub const MAX_DESCRIPTION_LENGTH: usize = 250;

// Voting limits
pub const MAX_SUPPORT_EPOCHS: u64 = 0; // Maximum 1 epochs for support phase

pub const BASIS_POINTS_MAX: u64 = 10_000;

// Anchor discriminator size
pub const ANCHOR_DISCRIMINATOR: usize = 8;

pub const MIN_PROPOSAL_STAKE_LAMPORTS: u64 = 1000 * 1_000_000_000;

pub const CLUSTER_SUPPORT_MULTIPLIER: u128 = 10000;

pub const CLUSTER_STAKE_MULTIPLIER: u128 = 1;

pub const DISCUSSION_EPOCHS: u64 = 0;
pub const VOTING_EPOCHS: u64 = 3;
pub const SNAPSHOT_EPOCH_EXTENSION: u64 = 1;
