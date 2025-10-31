// String length limits
pub const MAX_TITLE_LENGTH: usize = 50;
pub const MAX_DESCRIPTION_LENGTH: usize = 250;

// Voting limits
pub const MAX_SUPPORT_EPOCHS: u64 = 100; // Maximum 10 epochs for support phase

pub const BASIS_POINTS_MAX: u64 = 10_000;

// Anchor discriminator size
pub const ANCHOR_DISCRIMINATOR: usize = 8;

#[cfg(feature = "testing")]
pub const MIN_PROPOSAL_STAKE_LAMPORTS: u64 = 1_000_000_000;

// TODO: change these values
#[cfg(feature = "production")]
pub const MIN_PROPOSAL_STAKE_LAMPORTS: u64 = 1_000_000_000;

#[cfg(feature = "testing")]
pub const CLUSTER_SUPPORT_MULTIPLIER: u128 = 1;

#[cfg(feature = "production")]
pub const CLUSTER_SUPPORT_MULTIPLIER: u128 = 100000;

#[cfg(feature = "testing")]
pub const CLUSTER_STAKE_MULTIPLIER: u128 = 1;

#[cfg(feature = "production")]
pub const CLUSTER_STAKE_MULTIPLIER: u128 = 1;
