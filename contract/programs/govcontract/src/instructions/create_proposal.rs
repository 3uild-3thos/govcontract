use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        vote::{program as vote_program, state::VoteState},
        native_token::LAMPORTS_PER_SOL
    },
};

use crate::{
    constants::{MIN_PROPOSAL_STAKE_LAMPORTS, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, VOTE_STATE_VERSION_MAX},
    utils::{is_valid_github_link, get_vote_state_values},
    error::GovernanceError,
    stake_weight_bp,
    state::{Proposal, ProposalIndex}
};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: AccountInfo<'info>,
    #[account(
        init,
        payer = signer,
        seeds = [b"proposal", seed.to_le_bytes().as_ref(), spl_vote_account.key.as_ref()],
        bump,
        space = Proposal::INIT_SPACE,
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        mut,
        seeds = [b"index"],
        bump = proposal_index.bump
    )]
    pub proposal_index: Account<'info, ProposalIndex>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        start_epoch: u64,
        voting_length_epochs: u64,
        bumps: &CreateProposalBumps,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LENGTH, GovernanceError::TitleTooLong);

        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            GovernanceError::DescriptionTooLong
        );

        // Description must be a github link, leading to the proposal
        require!(
            is_valid_github_link(&description),
            GovernanceError::DescriptionInvalid
        );

        // Voting length can't be 0
        require_gt!(
            voting_length_epochs,
            0u64,
            GovernanceError::InvalidVotingLength
        );

        let vote_account_data = self.spl_vote_account.data.borrow();
        let (version, node_pubkey) = get_vote_state_values(&vote_account_data)
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        require!(version <= VOTE_STATE_VERSION_MAX, GovernanceError::InvalidVoteAccountVersion);

        // Validator identity must be part of the Vote account
        require_keys_eq!(
            node_pubkey,
            self.signer.key(),
            GovernanceError::InvalidVoteAccount
        );

        // Get cluster stake syscall
        let cluster_stake = get_epoch_total_stake();
        require_gt!(cluster_stake, 0u64, GovernanceError::InvalidClusterStake);
        msg!("Epoch stake {}", cluster_stake);

        // Get proposal creator stake
        let proposer_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);
        msg!("Validator stake {}", proposer_stake);

        // Only staked validators with at least 100k stake can submit a proposal to be considered for voting
        require_gte!(
            proposer_stake,
            MIN_PROPOSAL_STAKE_LAMPORTS,
            GovernanceError::NotEnoughStake
        );

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;

        // Start epoch must be current or future epoch
        require_gte!(
            start_epoch,
            current_epoch,
            GovernanceError::InvalidStartEpoch
        );

        // Add proposer stake weight to support weight??
        let proposer_stake_weight_bp =
            stake_weight_bp!(proposer_stake as u128, cluster_stake as u128)?;

        msg!("Validator stake weight BP{}", proposer_stake_weight_bp);

        self.proposal.set_inner(Proposal {
            author: self.signer.key(),
            title,
            description,
            creation_epoch: current_epoch,
            start_epoch,
            end_epoch: start_epoch
                .checked_add(voting_length_epochs)
                .ok_or(ProgramError::ArithmeticOverflow)?,
            proposer_stake_weight_bp: TryInto::<u64>::try_into(proposer_stake_weight_bp)?,
            cluster_support_lamports: 0,
            for_votes_lamports: 0,
            against_votes_lamports: 0,
            abstain_votes_lamports: 0,
            voting: false,
            finalized: false,
            proposal_bump: bumps.proposal,
            creation_timestamp: Clock::get()?.unix_timestamp,
            vote_count: 0,
            index: self.proposal_index.current_index + 1
        });
        self.proposal_index.current_index += 1;

        Ok(())
    }
}
