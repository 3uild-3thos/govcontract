// String length limits
pub const MAX_TITLE_LENGTH: usize = 50;
pub const MAX_DESCRIPTION_LENGTH: usize = 250;

// Voting limits
pub const MAX_SUPPORT_EPOCHS: u64 = 10; // Maximum 10 epochs for support phase

pub const BASIS_POINTS_MAX: u64 = 10_000;

// Stake requirements
pub const MIN_PROPOSAL_STAKE_LAMPORTS: u64 = 100_000 * 1_000_000_000; // 100k SOL in lamports

// Cluster stake calculation multipliers
pub const CLUSTER_SUPPORT_MULTIPLIER: u128 = 100;
pub const CLUSTER_STAKE_MULTIPLIER: u128 = 5;
