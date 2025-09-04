use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

/// Basis points divisor - represents 100% (10,000 basis points = 100%)
pub const BASIS_POINTS_DIVISOR: u64 = 10_000;

/// Minimum stake required to create a proposal (100k SOL)
pub const MIN_PROPOSAL_STAKE_LAMPORTS: u64 = 100_000 * LAMPORTS_PER_SOL;

pub const MAX_TITLE_LENGTH: usize = 50;

pub const MAX_DESCRIPTION_LENGTH: usize = 250;

pub const VOTE_STATE_VERSION_MAX: u32 = 2;
