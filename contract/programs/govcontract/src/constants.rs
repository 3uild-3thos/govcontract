// String length limits
pub const MAX_TITLE_LENGTH: usize = 50;
pub const MAX_DESCRIPTION_LENGTH: usize = 250;

// Voting limits
pub const MAX_VOTING_EPOCHS: u64 = 10; // Maximum 10 epochs for voting
pub const MAX_SUPPORT_EPOCHS: u64 = 10; // Maximum 10 epochs for support phase

pub const BASIS_POINTS_MAX: u64 = 10_000;

// Stake requirements
pub const MIN_PROPOSAL_STAKE_LAMPORTS: u64 = 100_000 * 1_000_000_000; // 100k SOL in lamports

// Program upgrade protection
// Set this to the slot where the current snapshot program was deployed
// Updates to the program after this slot will be rejected
pub const SNAPSHOT_PROGRAM_DEPLOY_SLOT: u64 = 0; // Set to actual deploy slot

// Cluster stake calculation multipliers
pub const CLUSTER_SUPPORT_MULTIPLIER: u128 = 100;
pub const CLUSTER_STAKE_MULTIPLIER: u128 = 5;
