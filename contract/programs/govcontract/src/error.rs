use anchor_lang::prelude::*;

#[error_code]
pub enum GovernanceError {
    #[msg("Minimum stake required to create proposal is 100k")]
    NotEnoughStake,
    #[msg("The title of the proposal is too long, max 50 char")]
    TitleTooLong,
    #[msg("The description of the proposal is too long, max 250 char")]
    DescriptionTooLong,
    #[msg("The description of the proposal must point to a github link")]
    DescriptionInvalid,
    #[msg("Invalid proposal ID")]
    InvalidProposalId,
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
    #[msg("Failed to deserialize node_pubkey from Vote account")]
    FailedDeserializeNodePubkey,
    #[msg("Deserialized node_pubkey from Vote accounts does not match")]
    VoteNodePubkeyMismatch,
    #[msg("Not enough accounts for tally")]
    NotEnoughAccounts,
    #[msg("Cluster stake cannot be zero")]
    InvalidClusterStake,
    #[msg("Start epoch must be current or future epoch")]
    InvalidStartEpoch,
    #[msg("Voting length must be bigger than 0")]
    InvalidVotingLength,
    #[msg("Invalid Vote account version")]
    InvalidVoteAccountVersion,
    #[msg("Invaid Vote account size")]
    InvalidVoteAccountSize,
    #[msg("All votes cast on the proposal must be counted to finalize")]
    AllVotesCount,
}
