/// Calculates the validator's stake weight in basis points (1 bp = 0.01%) relative to the cluster stake.
///
/// This macro uses integer arithmetic to compute the stake weight by multiplying the validator's stake
/// by 10,000 (to convert to basis points) and dividing by the total cluster stake.
///
/// # Arguments
///
/// * `validator_stake` - The stake of the validator, voter (u64).
/// * `cluster_stake` - The total stake in the cluster (u64). Must be non-zero.
///
/// # Returns
///
/// * `Result<u64, ProgramError>` - The stake weight in basis points (u64) if successful, or a
///   `ProgramError::ArithmeticOverflow` if the calculation overflows or if `cluster_stake` is zero.
///
/// # Example
///
/// ```rust
/// let validator_stake = 40_001u64;
/// let cluster_stake = 380_000_000u64;
/// let weight_bp = stake_weight_bp!(validator_stake, cluster_stake)?;
/// // Returns approximately 1 bp
/// ```
#[macro_export]
macro_rules! stake_weight_bp {
    ($validator_stake:expr, $cluster_stake:expr) => {
        $validator_stake
            .checked_mul(10_000)
            .ok_or(ProgramError::ArithmeticOverflow)
            .and_then(|mul_result| {
                mul_result
                    .checked_div($cluster_stake)
                    .ok_or(ProgramError::ArithmeticOverflow)
            })
    };
}
