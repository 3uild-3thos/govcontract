use anchor_lang::prelude::*;

use crate::constants::{
    MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, MAX_VOTING_EPOCHS
};

#[error_code]
pub enum GovernanceError {
    #[msg("Not enough stake for the instruction")]
    NotEnoughStake,
    #[msg("The title of the proposal cannot be empty")]
    TitleEmpty,
    #[msg("The title of the proposal is too long, max {MAX_TITLE_LENGTH} char")]
    TitleTooLong,
    #[msg("The description of the proposal cannot be empty")]
    DescriptionEmpty,
    #[msg("The description of the proposal is too long, max {MAX_DESCRIPTION_LENGTH} char")]
    DescriptionTooLong,
    #[msg("The description of the proposal must point to a github link")]
    DescriptionInvalid,
    #[msg("Voting on proposal not yet started")]
    VotingNotStarted,
    #[msg("Proposal closed")]
    ProposalClosed,
    #[msg("Proposal finalized")]
    ProposalFinalized,
    #[msg("Vote distribution must add up to 100% in Basis Points")]
    InvalidVoteDistribution,
    #[msg("Voting period not yet ended")]
    VotingPeriodNotEnded,
    #[msg("Invalid vote account, proposal id mismatch")]
    InvalidVoteAccount,
    #[msg("Start epoch must be current or future epoch")]
    InvalidStartEpoch,
    #[msg("Voting length must be bigger than 0")]
    InvalidVotingLength,
    #[msg("Invalid Vote account size")]
    InvalidVoteAccountSize,
    #[msg("Stake account invalid")]
    InvalidStakeAccount,
    #[msg("Only the original proposal author can add the merkle root hash")]
    UnauthorizedMerkleRootUpdate,
    #[msg("Merkle root hash is already set for this proposal")]
    MerkleRootAlreadySet,
    #[msg("Merkle root hash cannot be all zeros")]
    InvalidMerkleRoot,
    #[msg("Account must be owned by Snapshot program")]
    MustBeOwnedBySnapshotProgram,
    #[msg("Invalid consensus result PDA")]
    InvalidConsensusResultPDA,
    #[msg("Can't deserialize MetaMerkleProof PDA")]
    CantDeserializeMMPPDA,
    #[msg("Can't deserialize ConsensusResult")]
    CantDeserializeConsensusResult,
    #[msg("Cannot modify proposal after voting has started")]
    CannotModifyAfterStart,
    #[msg("Voting length exceeds maximum allowed epochs ({MAX_VOTING_EPOCHS})")]
    VotingLengthTooLong,
    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,
    #[msg("Invalid snapshot program")]
    InvalidSnapshotProgram,
    #[msg("Snapshot program has been upgraded, update protection triggered")]
    SnapshotProgramUpgraded,
    #[msg("Validator has already voted; use modify_vote to change")]
    ValidatorAlreadyVoted,
    #[msg("Validator has not voted yet; use cast_vote first")]
    ValidatorHasNotVoted,
}
