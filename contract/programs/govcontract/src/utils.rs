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

/// Validates if the input is a well-formed GitHub repository or issue link.
pub fn is_valid_github_link(link: &str) -> bool {
    const PREFIX: &str = "https://github.com/";
    const MAX_SEGMENTS: usize = 10;
    const MIN_SEGMENTS: usize = 2;

    if !link.starts_with(PREFIX) {
        return false;
    }

    let mut path = &link[PREFIX.len()..];
    if path.ends_with('/') {
        if path.len() == 1 { // If only '/', path would be empty after trim
            return false;
        }
        path = &path[..path.len() - 1];
    }
    if path.is_empty() || path.starts_with('/') {
        return false;
    }

    let mut segment_count = 0;
    let mut in_segment = false;
    let mut has_invalid_char = false;

    for c in path.chars() {
        match c {
            '/' => {
                if !in_segment {
                    // Consecutive '/' -> empty segment
                    return false;
                }
                in_segment = false;
                segment_count += 1;
                if segment_count > MAX_SEGMENTS {
                    return false;
                }
            }
            ' ' | '?' | '#' => {
                has_invalid_char = true;
                break; // Early exit on forbidden chars
            }
            _ => {
                if !in_segment {
                    in_segment = true;
                }
                if !c.is_alphanumeric() && !matches!(c, '-' | '_' | '.') {
                    has_invalid_char = true;
                    break;
                }
            }
        }
    }

    if has_invalid_char {
        return false;
    }

    // Account for the last segment if it was being processed
    if in_segment {
        segment_count += 1;
    }

    // Check trailing '/' was handled (no empty last segment)
    segment_count >= MIN_SEGMENTS && segment_count <= MAX_SEGMENTS
}
