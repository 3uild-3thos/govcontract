// Default RPC endpoints
pub const DEFAULT_RPC_URL: &str = "https://api.mainnet-beta.solana.com";
pub const DEFAULT_WSS_URL: &str = "wss://api.mainnet-beta.solana.com";

// Network-specific default RPC URLs
pub const DEFAULT_MAINNET_RPC_URL: &str = "https://api.mainnet-beta.solana.com";
pub const DEFAULT_TESTNET_RPC_URL: &str = "https://api.testnet.solana.com";

// Voting constants
pub const BASIS_POINTS_TOTAL: u64 = 10_000;

// Default operator API
pub const DEFAULT_OPERATOR_API_URL: &str = "http://84.32.100.123:8000";

// UI constants
pub const SPINNER_TICK_DURATION_MS: u64 = 100;

// Environment variable names
pub const SVMGOV_KEY_ENV: &str = "SVMGOV_KEY";
pub const SVMGOV_RPC_ENV: &str = "SVMGOV_RPC";
pub const SVMGOV_OPERATOR_URL_ENV: &str = "SVMGOV_OPERATOR_URL";

pub const DISCUSSION_EPOCHS: u64 = 4;
pub const VOTING_EPOCHS: u64 = 3;
pub const SNAPSHOT_EPOCH_EXTENSION: u64 = 1;
