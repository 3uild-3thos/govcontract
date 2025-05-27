use anchor_lang::prelude::*;

#[error_code]
pub enum GovernanceError {
    #[msg("Minimum stake required to create proposal is 40k")]
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
}
