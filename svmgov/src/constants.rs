// Default RPC endpoints
pub const DEFAULT_RPC_URL: &str = "https://api.mainnet-beta.solana.com";
pub const DEFAULT_WSS_URL: &str = "wss://api.mainnet-beta.solana.com";

// Voting constants
pub const BASIS_POINTS_TOTAL: u64 = 10_000;

// Default operator API
pub const DEFAULT_OPERATOR_API_URL: &str = "http://84.32.100.123:8000";

// UI constants
pub const SPINNER_TICK_DURATION_MS: u64 = 100;

// Stake account constants
pub const STAKE_ACCOUNT_DATA_SIZE: u64 = 200;
pub const STAKE_ACCOUNT_WITHDRAW_AUTHORITY_OFFSET: usize = 44;

// Mock data constants
pub const MOCK_MERKLE_PROOF_LEVELS: usize = 3;

// Environment variable names
pub const SVMGOV_KEY_ENV: &str = "SVMGOV_KEY";
pub const SVMGOV_RPC_ENV: &str = "SVMGOV_RPC";
pub const SVMGOV_OPERATOR_URL_ENV: &str = "SVMGOV_OPERATOR_URL";
