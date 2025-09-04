use anchor_lang::{
    prelude::*,
    solana_program::{
        vote::{program as vote_program, state::VoteState},
    }
};

use crate::{
    constants::VOTE_STATE_VERSION_MAX,
    error::GovernanceError,
    state::{Proposal, Vote},
    utils::get_vote_state_values,
};

#[derive(Accounts)]
pub struct RefundVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: AccountInfo<'info>,
    #[account(
        mut,
        constraint = proposal.finalized @ GovernanceError::ProposalNotFinalized
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        mut,
        close = signer,
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.key().as_ref()],
        bump = vote.bump,
        constraint = vote.tallied @ GovernanceError::VoteNotTallied
    )]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

impl<'info> RefundVote<'info> {
    pub fn refund_vote(&mut self) -> Result<()> {
        let vote_account_data = self.spl_vote_account.data.borrow();
        let (version, node_pubkey) = get_vote_state_values(&vote_account_data)
            .map_err(|_| GovernanceError::InvalidVoteAccountVersion)?;

        require!(version <= VOTE_STATE_VERSION_MAX, GovernanceError::InvalidVoteAccountVersion);

        // Only the original validator can refund their vote
        require_keys_eq!(
            node_pubkey,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );

        msg!("Refunding vote for validator {} on proposal {}", self.signer.key(), self.proposal.key());

        Ok(())
    }
}
