# PROJECT: GOVCONTRACT

- Reviewed by : [Lamsy](https://x.com/@lamsyhay)
  - Telegram: [Lamsy](https://t.me/lamsykay)
  - Github : [LamsyA](https://github.com/Lamsya)

# About Govcontract

It is a decentralized governance platform for Solana validators featuring merkle proof verification, stake-weighted voting, and real-time event monitoring.

# Disclaimer

This code review is not to be considered as a security guarantee. The review is conducted to the best of my knowledge according to industry best practices and understanding of the codebase at the time of review. Subsequent security reviews, bug bounty programs and on-chain monitoring are strongly recommended.

# Risk Classification

| Severity               | Impact: High | Impact: Medium | Impact: Low |
| ---------------------- | ------------ | -------------- | ----------- |
| **Likelihood: High**   | Critical     | High           | Medium      |
| **Likelihood: Medium** | High         | Medium         | Low         |
| **Likelihood: Low**    | Medium       | Low            | Low         |

## Impact

- High - leads to a significant material loss of assets in the protocol or significantly harms a group of users.

- Medium - leads to a moderate material loss of assets in the protocol or moderately harms a group of users.

- Low - leads to a minor material loss of assets in the protocol or harms a small group of users.

## Likelihood

- High - attack path is possible with reasonable assumptions that mimic on-chain conditions, and the cost of the attack is relatively low compared to the amount of funds that can be stolen or lost.

- Medium - only a conditionally incentivized attack vector, but still relatively likely.

- Low - has too many or too unlikely assumptions or requires a significant stake by the attacker with little or no incentive.

## Action required for severity levels

- Critical - Must fix as soon as possible (if already deployed)

- High - Must fix (before deployment if not already deployed)

- Medium - Should fix

- Low - Could fix

### Scope

The following smart contracts were in scope of the audit:

- programs/govcontract/src/\*\*.rs

---

# Finding

---

## Issue 1:

## Title: Proposal Support Phase Has No Expiration

## Severity: Medium

## Finding description and impact

The governance system allows proposals to remain in the support phase indefinitely until the required threshold is met. There is no expiration or maximum epoch limit for gathering support. This design creates the risk of "zombie proposals" persisting on-chain without resolution, leading to governance inefficiency, potential manipulation by late-stage mobilization of votes, Unpredictable governance behavior.

## Recommended mitigation steps

Introduce a maximum support window for proposals. Define an upper bound

```rust
// add to the constant
pub const MAX_SUPPORT_EPOCHS: u64 = 10; // 10 epochs max for support phase
// Add to Proposal struct
pub support_deadline_epoch: u64,

// In create_proposal
support_deadline_epoch: clock.epoch + MAX_SUPPORT_EPOCHS,

// In support_proposal validation
require!(
    clock.epoch <= self.proposal.support_deadline_epoch,
    GovernanceError::SupportPeriodExpired
);
```

#### Fix: commit hash [79cc176](https://github.com/3uild-3thos/govcontract/commit/79cc176793be9ce9be518be077f78dfa2f3d62eb#diff-4cd51d42ab003037cc67414094a093ed09bd90000af9ab84954648b513ff7ca1R60)

## Issue 2:

## Title: Runtime Panic from Unwrapping None merkle_root_hash and Better error handling.

## Severity: High

### Finding description and impact

The support_proposal and cast_vote instructions contain unsafe .unwrap() calls on proposal.merkle_root_hash which is an Option<[u8; 32]> field:

[support_proposal.rs](https://github.com/3uild-3thos/govcontract/blob/923e6b61a460265b1dbd75bec35c1ef4907debcc/contract/programs/govcontract/src/instructions/support_proposal.rs#L72-L75) and [cast vote](https://github.com/3uild-3thos/govcontract/blob/923e6b61a460265b1dbd75bec35c1ef4907debcc/contract/programs/govcontract/src/instructions/cast_vote.rs#L104-L107)

```js
// In support_proposal.rs and cast_vote.rs
require!(
    consensus_result.ballot.meta_merkle_root == self.proposal.merkle_root_hash.unwrap(),
    GovernanceError::InvalidMerkleRoot
);
```

Root Cause: When proposals are created, merkle_root_hash defaults to None. The proposal author must call add_merkle_root to set this value before supporters can interact with the proposal.

Attack Vector: An attacker can call support_proposal on any newly created proposal before the author sets the merkle root, causing a runtime panic that crashes the program execution.

Impact:

Denial of Service: Any new proposal can be permanently broken by triggering the panic

### Recommended mitigation steps

Replace the unsafe `.unwrap()` calls with proper error handling:

```js
let merkle_root = self.proposal.merkle_root_hash
    .ok_or(GovernanceError::MerkleRootNotSet)?;
require!(
    consensus_result.ballot.meta_merkle_root == merkle_root,
    GovernanceError::InvalidMerkleRoot
);
```

Add the corresponding error variant to the GovernanceError enum:

```js
#[msg("Merkle root hash has not been set for this proposal")]
MerkleRootNotSet,
```

#### Fix: commit hash [6c5c174](https://github.com/3uild-3thos/govcontract/commit/6c5c174fc2504a11ead879f88c32fd4732a970b0)

## Issue 3:

# Title: Critical Seed Mismatch in Vote Override Cache Creation

**Severity: High**

## Finding description and impact

The `cast_vote_override.rs` instruction contains a critical seed mismatch bug when creating the vote override cache account manually. The seeds used for account creation do not match the seeds defined in the account structure, causing transaction failures.

**Root Cause:** In the else branch where the vote override cache is created via CPI, the code uses incorrect seeds:

```rust
// ACCOUNT DEFINITION (Correct)
#[account(
    mut,
    seeds = [b"vote_override_cache", proposal.key().as_ref(), validator_vote.key().as_ref()],
    bump
)]
pub vote_override_cache: UncheckedAccount<'info>,

// MANUAL CREATION (Wrong)
let seeds = &[
    b"vote_override",           // ❌ Should be "vote_override_cache"
    proposal_key.as_ref(),
    validator_vote_key.as_ref(),
    &[bumps.vote_override_cache],
];
```

**Attack Vector:** This bug triggers when:

1. A delegator attempts to override a validator's vote
2. The validator hasn't voted yet (no Vote PDA exists)
3. No vote override cache exists yet (first delegator for this validator)

**Impact:**

- **Transaction Failure:** The `invoke_signed` call will fail due to address mismatch between expected PDA and created account
- **Broken Delegator-First Voting:** The delegator-first voting scenario becomes completely unusable
- **System Functionality Loss:** First delegator overrides for any validator will always fail
- **Governance Disruption:** Delegators cannot exercise their override rights when voting before validators

The Solana runtime rejects the transaction because the account address derived from the provided seeds doesn't match the expected PDA address, making it impossible to create the vote override cache.

## Recommended mitigation steps

Fix the seed mismatch by using the correct seed prefix:

```rust
let seeds = &[
    b"vote_override_cache",  // ✅ CORRECT - matches account definition
    proposal_key.as_ref(),
    validator_vote_key.as_ref(),
    &[bumps.vote_override_cache],
];
```

#### Fix: Commit hash [dbe6718](https://github.com/3uild-3thos/govcontract/commit/dbe67180f1e69aac521d3c176d9230292e82fc69)

## Issue 4:

# Title: Incorrect PDA Ownership Validation in Vote Override Cache

**Severity: Critcal**

## Finding description and impact

Both `cast_vote.rs` and `cast_vote_override.rs` instructions contain incorrect ownership validation for the `vote_override_cache` PDA, causing systematic failures in the vote override functionality. The code incorrectly expects the cache PDA to be owned by Solana's native vote program instead of the governance program that derives it.

**Root Cause:** The ownership validation checks use the wrong program ID:

```rust
// INCORRECT - In both cast_vote.rs and cast_vote_override.rs
if self.vote_override_cache.data_len() == VoteOverrideCache::INIT_SPACE
    && self.vote_override_cache.owner == &vote_program::ID  // ❌ Wrong program ID
    && VoteOverrideCache::deserialize(...).is_ok()
```

**Account Definition vs Validation Mismatch:**

```rust
// Account is defined as governance program PDA
#[account(
    mut,
    seeds = [b"vote_override_cache", proposal.key().as_ref(), validator_vote.key().as_ref()],
    bump
)]
pub vote_override_cache: UncheckedAccount<'info>,

// But validation expects vote program ownership
&& self.vote_override_cache.owner == &vote_program::ID  // ❌ Inconsistent
```

**Fundamental Issue:** PDAs are always owned by the program that derives them. Since `vote_override_cache` is derived by the governance program using its seeds, it must be owned by the governance program (`crate::ID`), not Solana's vote program (`vote_program::ID`).

**Impact:**

- **Complete Vote Override Failure:** The ownership check always fails, preventing vote override cache functionality
- **Broken Delegator-First Voting:** Delegators cannot vote before validators due to cache validation failures
- **System Unusability:** Core vote override features are completely non-functional
- **Test Failures:** Causes access violations and transaction failures in testing
- **Silent Logic Errors:** Code appears correct but fails at runtime due to ownership mismatch

The same issue affects the `validator_vote` PDA validation in `cast_vote_override.rs`, creating a systematic pattern of incorrect ownership expectations throughout the vote override system.

## Recommended mitigation steps

Fix the ownership validation to use the correct program ID:

**For `vote_override_cache` in both files:**

```rust
// CORRECT - Check for governance program ownership
if self.vote_override_cache.data_len() == VoteOverrideCache::INIT_SPACE
    && self.vote_override_cache.owner == &crate::ID  // ✅ Governance program owns its PDAs
    && VoteOverrideCache::deserialize(...).is_ok()
```

**For `validator_vote` in cast_vote_override.rs:**

```rust
// CORRECT - Check for governance program ownership
if self.validator_vote.data_len() == Vote::INIT_SPACE
    && self.validator_vote.owner == &crate::ID  // ✅ Governance program owns its PDAs
    && Vote::deserialize(...).is_ok()
```

#### Fix: Commit hash [d5e467d](https://github.com/3uild-3thos/govcontract/commit/d5e467d2e63198cb86c5afd9237eb69d37a18481)

## Issue 5:

# Title: Cache Updates Not Persisted Due to Missing Serialization

**Severity: High**

## Finding description and impact

The `cast_vote_override.rs` instruction contains a critical bug where vote override cache updates are modified in memory but never serialized back to the on-chain account, resulting in complete data loss for subsequent delegator overrides.

**Root Cause:** When updating an existing vote override cache, the code deserializes the cache data into a local struct, modifies it in memory, but fails to serialize the changes back to the account:

```rust
// In cast_vote_override.rs - cache update path
if self.vote_override_cache.owner == &crate::ID
    && VoteOverrideCache::deserialize(...).is_ok()
{
    // Deserialize creates LOCAL COPY in memory
    let mut vote_override_cache = VoteOverrideCache::deserialize(...)?;

    // Modify LOCAL COPY only
    vote_override_cache.for_votes_bp = vote_override_cache
        .for_votes_bp
        .checked_add(for_votes_bp)?;
    // ... more modifications to local copy ...

    // ❌ BUG: NO SERIALIZATION BACK TO ACCOUNT
    // All changes exist only in memory and are lost when function ends
}
```

**Proof of Bug:** Testing with two sequential delegator overrides shows:

- First delegator creates cache successfully
- Second delegator's transaction completes without error
- Cache account data remains completely unchanged (identical raw bytes)
- Second delegator's vote data is completely lost

**Comparison with Working Code:** The same function correctly serializes data when creating a new cache:

```rust
// Creating new cache (works correctly)
let vote_override_cache = VoteOverrideCache { ... };
let mut account_data = self.vote_override_cache.data.borrow_mut();
let serialized = borsh::to_vec(&vote_override_cache)?;
account_data[0..serialized.len()].copy_from_slice(&serialized);  // ✅ Correct
```

**Impact:**

- **Data Loss:** All subsequent delegator vote overrides are silently lost
- **Broken Multi-Delegator Voting:** Only the first delegator's vote is preserved in cache
- **Silent Failure:** Transactions succeed but functionality is completely broken
- **System Malfunction:** Vote override accumulation system is non-functional
- **Governance Disruption:** Delegators lose their voting rights in multi-delegator scenarios

## Recommended mitigation steps

Add the missing serialization code after all cache modifications in the cache update path:

```rust
// After all modifications to vote_override_cache
let mut account_data = self.vote_override_cache.data.borrow_mut();
let serialized = borsh::to_vec(&vote_override_cache).map_err(|e| {
    msg!("Error serializing VoteOverrideCache: {}", e);
    GovernanceError::ArithmeticOverflow
})?;
account_data[0..serialized.len()].copy_from_slice(&serialized);
```

#### Fix: Commit hash [667d7e3](https://github.com/3uild-3thos/govcontract/commit/667d7e3220ab246bff50a19b98f9eb57ffc0010f)

## Issue 6:

# Title: Incorrect Account Size Validation in Vote Instructions

**Severity: Critical**

## Finding description and impact

Multiple instructions contain systematic errors in account size validation checks, causing conditional logic to fail and preventing core vote override functionality from working correctly. The code incorrectly compares account data length (which includes the 8-byte discriminator) with struct size constants (which exclude the discriminator).

**Root Cause:** All Anchor accounts created with the `#[account]` macro have an 8-byte discriminator prefix, making the total account size `8 + INIT_SPACE`. However, the validation checks compare `data_len()` (total size including discriminator) with just `INIT_SPACE` (struct size without discriminator).

**Affected Size Checks:**

1. **cast_vote_override.rs - validator_vote check:**

```rust
// WRONG: Compares 144 bytes with 137 bytes
if self.validator_vote.data_len() == Vote::INIT_SPACE  // ❌ Should be 8 + Vote::INIT_SPACE
    && self.validator_vote.owner == &vote_program::ID
    && Vote::deserialize(...).is_ok()
```

2. **cast_vote_override.rs - vote_override_cache check:**

```rust
// WRONG: Compares 161 bytes with 153 bytes
if self.vote_override_cache.data_len() == VoteOverrideCache::INIT_SPACE  // ❌ Should be 8 + VoteOverrideCache::INIT_SPACE
    && self.vote_override_cache.owner == &crate::ID
    && VoteOverrideCache::deserialize(...).is_ok()
```

3. **cast_vote.rs - vote_override_cache check:**

```rust
// WRONG: Compares 161 bytes with 153 bytes
if self.vote_override_cache.data_len() == VoteOverrideCache::INIT_SPACE  // ❌ Should be 8 + VoteOverrideCache::INIT_SPACE
    && self.vote_override_cache.owner == &vote_program::ID
    && VoteOverrideCache::deserialize(...).is_ok()
```

**Account Creation vs Validation Mismatch:**

```rust
// Account created with discriminator
space = 8 + Vote::INIT_SPACE,  // Total: 161 bytes

// But validation expects struct size only
data_len() == Vote::INIT_SPACE  // Expects: 153 bytes, Actual: 161 bytes
```

**Impact:**

- **Broken Conditional Logic:** Size checks always fail, causing wrong execution paths
- **Vote Override Failure:** Delegator overrides after validator votes don't work
- **Cache System Malfunction:** Cache updates and processing fail systematically
- **Duplicate Account Creation:** System tries to create accounts that already exist
- **Transaction Failures:** Access violations and "account already in use" errors
- **Core Functionality Broken:** Vote override system is completely non-functional

**Test Evidence:** When the incorrect size check is added back to the code, tests fail with:

```
"Create Account: account Address { address: ... } already in use"
```

This occurs because the size check fails (161 ≠ 153) and (144 ≠ 137), causing the code to attempt creating a new account instead of updating the existing one.

## Recommended mitigation steps

Fix all size validation checks to account for the 8-byte discriminator:

**1. cast_vote_override.rs - validator_vote check:**

```rust
if self.validator_vote.data_len() == (8 + Vote::INIT_SPACE)  // ✅ Correct: 161 bytes
    && self.validator_vote.owner == &crate::ID  // Also fix ownership
    && Vote::deserialize(...).is_ok()
```

**2. cast_vote_override.rs - vote_override_cache check:**

```rust
if self.vote_override_cache.data_len() == (8 + VoteOverrideCache::INIT_SPACE)  // ✅ Correct: 161 bytes
    && self.vote_override_cache.owner == &crate::ID
    && VoteOverrideCache::deserialize(...).is_ok()
```

**3. cast_vote.rs - vote_override_cache check:**

```rust
if self.vote_override_cache.data_len() == (8 + VoteOverrideCache::INIT_SPACE)  // ✅ Correct: 161 bytes
    && self.vote_override_cache.owner == &crate::ID  // Also fix ownership
    && VoteOverrideCache::deserialize(...).is_ok()
```

**Pattern:** All Anchor account size checks should use `(8 + INIT_SPACE)` when comparing with `data_len()` to account for the discriminator prefix.

#### Fix: commit hash [46a69af](https://github.com/3uild-3thos/govcontract/commit/46a69af0202c24cbf0962ed8522edf10f8723055)

## Issue 7:

**Title:** Inconsistent Vote Count Logic Between Validator and Delegator Votes
**Severity:** Medium

## Finding description and impact

The handling of `self.proposal.vote_count += 1` is inconsistent between `cast_vote.rs` and `cast_vote_override.rs`.
In `cast_vote.rs`, it is only incremented when a validator votes first, potentially skipping count updates if a delegator votes before the validator. In contrast, `cast_vote_override.rs` increments the counter unconditionally, ensuring every delegator vote is counted.
This asymmetry can cause discrepancies in proposal vote totals — for example, missing validator votes in cases where delegators vote first.

## Recommended mitigation steps

Move `self.proposal.vote_count += 1` to the end of `cast_vote.rs` unconditionally, mirroring the logic in `cast_vote_override.rs`.
This ensures that both validator and delegator votes are always counted once per unique voter, regardless of voting order, maintaining accurate and consistent proposal statistics.

#### Fix: Commit hash [d1327ae](https://github.com/3uild-3thos/govcontract/commit/d1327ae063b979de41899a011514a2174238e44e)

## Issue 8:

# Title: Vote PDA Initialization Failure in Delegator-First Voting Scenarios

## Severity: Critcal

## Finding description and impact

The `cast_vote.rs` instruction contains a critical initialization bug that completely nullifies validator votes when delegators vote before the validator. The root cause lies in the cache processing branch where the code attempts to read basis points from an uninitialized Vote PDA.

**Root Cause:**
When delegators vote first, a vote override cache is created. Later, when the validator calls `cast_vote`, the Vote PDA is marked with `init` (creating a new, uninitialized account) but the cache processing branch immediately tries to read `self.vote.for_votes_bp, self.vote.against_votes_bp, self.vote.abstain_votes_bp` before any initialization occurs:

```rust
// BUG: Reading from uninitialized Vote PDA
let for_votes_lamports_new =
    calculate_vote_lamports!(new_validator_stake, self.vote.for_votes_bp)?; //@audit self.vote.for_votes_bp = 0
let against_votes_lamports_new =
    calculate_vote_lamports!(new_validator_stake, self.vote.against_votes_bp)?; //@audit self.vote.against_votes_bp = 0
let abstain_votes_lamports_new =
    calculate_vote_lamports!(new_validator_stake, self.vote.abstain_votes_bp)?; //@audit self.vote.abstain_votes_bp = 0

```

Since the Vote PDA contains default/zero values, all calculations result in zero lamports regardless of the validator's actual voting preferences passed as function parameters.

**Critical Impact:**

1. **Complete Loss of Validator Votes**: Validator's voting choices are entirely ignored, contributing 0 lamports to all vote categories despite having significant stake
2. **Vote PDA Data Corruption**: The Vote PDA remains in an invalid state with zero/default values for all critical fields:
   - `for_votes_bp: 0` (should be validator's choice)
   - `against_votes_bp: 0` (should be validator's choice)
   - `abstain_votes_bp: 0` (should be validator's choice)
   - `for_votes_lamports: 0` (should be reduced stake \* bp)
   - `validator: Pubkey::default()` (should be validator's pubkey)
   - `stake: 0` (should be full validator stake)
3. **Governance Manipulation**: Delegators can effectively nullify their validator's vote by voting first, creating an attack vector where early delegator votes can silence validator preferences
4. **Inconsistent Proposal Accounting**: Proposal totals include delegator votes but exclude validator contributions, leading to incorrect governance outcomes
5. **System State Inconsistency**: The voting system behaves completely differently based on voting order, violating governance fairness principles

**Attack Scenario:**
A malicious delegator can intentionally vote first on any proposal to ensure their validator's actual voting preferences are completely ignored, effectively giving the delegator full control over the validator's entire stake weight in governance decisions.

## Recommended mitigation steps

Fix the cache processing branch to use function parameters instead of the uninitialized Vote PDA and properly initialize all Vote PDA fields:

```rust
// CORRECT: Use function parameters for calculations
let for_votes_lamports_new =
    calculate_vote_lamports!(new_validator_stake, for_votes_bp)?;
let against_votes_lamports_new =
    calculate_vote_lamports!(new_validator_stake, against_votes_bp)?;
let abstain_votes_lamports_new =
    calculate_vote_lamports!(new_validator_stake, abstain_votes_bp)?;

// Add validator's reduced votes to proposal
self.proposal.add_vote_lamports(
    for_votes_lamports_new,
    against_votes_lamports_new,
    abstain_votes_lamports_new,
)?;

// Properly initialize the Vote PDA with all required fields
self.vote.set_inner(Vote {
    validator: self.signer.key(),
    proposal: self.proposal.key(),
    for_votes_bp,                           // Use function parameters
    against_votes_bp,                       // Use function parameters
    abstain_votes_bp,                       // Use function parameters
    for_votes_lamports: for_votes_lamports_new,
    against_votes_lamports: against_votes_lamports_new,
    abstain_votes_lamports: abstain_votes_lamports_new,
    override_lamports: override_cache.total_stake,
    stake: voter_stake,
    vote_timestamp: clock.unix_timestamp,
    bump: bumps.vote,
});

// Emit the missing VoteCast event
emit!(VoteCast {
    proposal_id: self.proposal.key(),
    voter: self.signer.key(),
    vote_account: self.spl_vote_account.key(),
    for_votes_bp,
    against_votes_bp,
    abstain_votes_bp,
    for_votes_lamports: for_votes_lamports_new,
    against_votes_lamports: against_votes_lamports_new,
    abstain_votes_lamports: abstain_votes_lamports_new,
    vote_timestamp: clock.unix_timestamp,
});
```

#### Fix commit hash [a7b9142](https://github.com/3uild-3thos/govcontract/blob/a7b914257538ce038ccb20ca2eb9a13e5aac5b43/contract/programs/govcontract/src/instructions/cast_vote.rs#L203-L229)

## Issue 9:

# Title: Vote Deserialization Bug Causes Arithmetic Overflow in Delegator Override System

## Severity: High

## Finding description and impact

The `cast_vote_override.rs` instruction contains a critical deserialization bug that causes arithmetic overflow when delegators attempt to override validator votes. The root cause lies in the manual deserialization of the Vote PDA, where the code incorrectly reads the raw account data including the 8-byte Anchor discriminator.

**Root Cause:**
`Delegator 1 ----> Validator ---->  Delegator 2`
When a delegator attempts to override a validator's existing vote, the code manually deserializes the Vote PDA to read the current vote amounts:

```rust
// @audit BUG: Reading raw account data including 8-byte discriminator
let mut validator_vote =
    Vote::deserialize(&mut self.validator_vote.data.borrow().as_ref())?;
```

Since Anchor accounts have an 8-byte discriminator prefix, the `Vote::deserialize()` function expects to read the struct data starting from the actual data (after the discriminator), but the code provides the entire account data including the discriminator. This causes field misalignment and results in reading incorrect values from wrong memory offsets.

**Evidence from Test Logs:**

```
// Correct values (from program.account.vote.fetch):
Validator vote for votes lamports: 59999820000000
Validator vote against votes lamports: 29999910000000
Validator vote abstain votes lamports: 9999970000000

// Incorrect values (from manual deserialization):
validator_vote.for_votes_lamports: 1000  ← Wrong!
validator_vote.against_votes_lamports: 59999820000000  ← Wrong field!
validator_vote.abstain_votes_lamports: 29999910000000  ← Wrong field!
```

**Critical Impact:**

1. **Arithmetic Overflow**: When the code attempts to subtract the incorrectly deserialized vote amounts from the proposal totals, it causes underflow:

   ```rust
   // This fails: 30,000,000,000,000 - 59,999,820,000,000 = UNDERFLOW
   self.proposal.sub_vote_lamports(
       1000,                    // Wrong value
       59999820000000,         // Should be 29999910000000
       29999910000000,         // Should be 9999970000000
   )?;
   ```

2. **Complete Delegator Override Failure**: The delegator-after-validator voting scenario becomes completely unusable, as any attempt to override an existing validator vote results in transaction failure

3. **Data Corruption**: The Vote PDA contains correct data, but the manual deserialization reads garbage values, leading to inconsistent state calculations

4. **Governance System Breakdown**: A core feature of the governance system (delegator vote overrides) is completely non-functional when validators vote first

5. **Silent Data Misalignment**: The bug manifests as arithmetic overflow rather than a clear deserialization error, making it difficult to diagnose

**Attack Vector:**
This bug can be triggered by any delegator attempting to override their validator's vote after the validator has already voted, making it a systematic failure rather than an edge case.

## Recommended mitigation steps

Fix the manual deserialization to skip the 8-byte Anchor discriminator:

```rust
// CORRECT: Skip the 8-byte discriminator when deserializing
let mut validator_vote =
    Vote::deserialize(&mut &self.validator_vote.data.borrow()[8..])?;
```

#### fix commit hash [a7b9142](https://github.com/3uild-3thos/govcontract/commit/a7b914257538ce038ccb20ca2eb9a13e5aac5b43)

# Issue 10:

# **Missing Validator Vote Account Serialization in cast_vote_override**

**Severity: High**

## Finding description and impact

The `cast_vote_override` instruction contains a critical serialization bug where validator vote account updates are performed in memory but never persisted to the blockchain. This occurs in the IF branch of `cast_vote_override.rs` where the code updates the validator vote structure but fails to serialize the changes back to the account.

**Root Cause:**
In `cast_vote_override.rs`, the validator vote account is updated in memory:

```rust
validator_vote.for_votes_lamports = for_votes_lamports_new;
validator_vote.against_votes_lamports = against_votes_lamports_new;
validator_vote.abstain_votes_lamports = abstain_votes_lamports_new;
validator_vote.override_lamports = validator_vote
    .override_lamports
    .checked_add(delegator_stake)
    .ok_or(GovernanceError::ArithmeticOverflow)?;
```

However, unlike the cache serialization code found elsewhere in the same file , there is no corresponding serialization code to write these updates back to the validator vote account on the blockchain.

**Impact:**

1. **State Corruption**: Validator vote accounts retain stale data after delegator overrides, causing inconsistent state between memory and persistent storage
2. **Arithmetic Overflow**: When subsequent delegators attempt to override the same validator, they read the original (stale) validator vote values and perform calculations that result in arithmetic overflow errors
3. **System Failure**: Multi-delegator scenarios become impossible, as the second and subsequent delegators will always fail with `ArithmeticOverflow`
4. **Vote Tracking Breakdown**: The `override_lamports` field never updates in persistent storage, breaking the delegation tracking mechanism
5. **Governance Disruption**: Critical governance proposals requiring multiple delegator participation will fail, undermining the entire delegation system

**Evidence from Testing:**

- Validator override lamports remain 0 after first delegator (should be 1.0 SOL)
- Validator vote lamports show original values (60k, 30k, 10k SOL) instead of recalculated values
- Second delegator fails with `ArithmeticOverflow` error code 6035
- Program logs show stale validator vote data being used in calculations

## Recommended mitigation steps

Add the missing validator vote serialization code immediately after the validator vote updates `cast_vote_override.rs`:

```rust
// Serialize the updated validator vote back to the account
let mut validator_vote_data = self.validator_vote.data.borrow_mut();
let mut vote_bytes = &mut validator_vote_data[8..]; // Skip discriminator
validator_vote
    .serialize(&mut vote_bytes)
    .map_err(|e| {
        msg!("Error serializing Vote: {}", e);
        GovernanceError::ArithmeticOverflow
    })?;
```

#### Fix commit hash [2a6ea0b](https://github.com/3uild-3thos/govcontract/commit/2a6ea0bb618da5f4e7c67f8955ca12ba8a1f6645)

# Issue 11:

# Title: Validator Vote Account Corruption in modify_vote_override

**Severity: Low**

## Finding description and impact

The `modify_vote_override.rs` function contains a low severity architectural bug where delegator vote amounts are incorrectly applied to the validator vote account, attempt to subtract old delegator vote lamports and add new delegator vote lamports directly to the validator's vote account:

```rust
// ❌ Bug
  validator_vote.for_votes_lamports = validator_vote
            .for_votes_lamports
            .checked_sub(old_for_votes_lamports)
            .and_then(|val| val.checked_add(for_votes_lamports))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        validator_vote.against_votes_lamports = validator_vote
            .against_votes_lamports
            .checked_sub(old_against_votes_lamports)
            .and_then(|val| val.checked_add(against_votes_lamports))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        validator_vote.abstain_votes_lamports = validator_vote
            .abstain_votes_lamports
            .checked_sub(old_abstain_votes_lamports)
            .and_then(|val| val.checked_add(abstain_votes_lamports))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        // Serialize the updated validator vote back to the account
        let mut validator_vote_data = self.validator_vote.data.borrow_mut();
        let serialized = borsh::to_vec(&validator_vote).map_err(|e| {
            msg!("Error serializing Vote: {}", e);
            GovernanceError::ArithmeticOverflow
        })?;
        validator_vote_data[8..8 + serialized.len()].copy_from_slice(&serialized);

```

This violates the system's vote accounting architecture where:

- **Validator vote accounts** should only contain the validator's own reduced stake votes
- **Vote override accounts** should contain individual delegator votes
- **Vote override cache** should contain aggregated delegator votes

**Impact:**

1. **Integer overflow**: Arithmetic operations on mismatched vote amounts cause massive overflow (observed: 11+ billion SOL in test results)

## Recommended mitigation steps

Remove it from `modify_vote_override.rs`. The validator vote account should remain unchanged when delegators modify their vote overrides.
Remove all this:

```rust
  validator_vote.for_votes_lamports = validator_vote
            .for_votes_lamports
            .checked_sub(old_for_votes_lamports)
            .and_then(|val| val.checked_add(for_votes_lamports))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        validator_vote.against_votes_lamports = validator_vote
            .against_votes_lamports
            .checked_sub(old_against_votes_lamports)
            .and_then(|val| val.checked_add(against_votes_lamports))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        validator_vote.abstain_votes_lamports = validator_vote
            .abstain_votes_lamports
            .checked_sub(old_abstain_votes_lamports)
            .and_then(|val| val.checked_add(abstain_votes_lamports))
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        // Serialize the updated validator vote back to the account
        let mut validator_vote_data = self.validator_vote.data.borrow_mut();
        let serialized = borsh::to_vec(&validator_vote).map_err(|e| {
            msg!("Error serializing Vote: {}", e);
            GovernanceError::ArithmeticOverflow
        })?;
        validator_vote_data[8..8 + serialized.len()].copy_from_slice(&serialized);

```

The correct flow should be:

1. ✅ Update proposal totals (subtract old delegator vote, add new delegator vote)
2. ✅ Update vote override account with new delegator values
3. ✅ Update vote override cache with new aggregated values
4. ❌ **DO NOT** modify validator vote account with delegator amounts

#### Fix commit hash [fa72852](https://github.com/3uild-3thos/govcontract/commit/fa728528eb042cc74f790e5e86b5d199b7d10f98#diff-63a60f655e05807da8fe50644132fb3f4f06f01c848fedc459679c0827dd585dL199-L203)
