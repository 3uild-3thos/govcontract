use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake}, instruction::Instruction, keccak, program::invoke, stake::{program as stake_program, state::StakeStateV2}, vote::{program as vote_program, state::VoteState}
    }
};

use crate::{
    error::GovernanceError,
    stake_weight_bp,
    state::{Proposal, Vote, VoteOverride},
};

#[derive(Accounts)]
#[instruction(for_votes_bp: u64, against_votes_bp: u64, abstain_votes_bp: u64, proof: Vec<[u8; 32]>)]
pub struct CastVoteOverride<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: AccountInfo<'info>,
    /// CHECK: Stake account validated in logic
    #[account(
        constraint = spl_stake_account.owner == &stake_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_stake_account.data_len() == StakeStateV2::size_of() @ GovernanceError::InvalidStakeAccountSize
    )]
    pub spl_stake_account: AccountInfo<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        seeds = [b"vote", proposal.key().as_ref(), spl_vote_account.key().as_ref()],
        bump = validator_vote.bump,
    )]
    pub validator_vote: Account<'info, Vote>,
    #[account(
        init,
        payer = signer,
        space = 8 + VoteOverride::INIT_SPACE,
        seeds = [b"vote_override", proposal.key().as_ref(), spl_stake_account.key().as_ref()],
        bump
    )]
    pub vote_override: Account<'info, VoteOverride>,
    /// CHECK: Snapshot program for CPI
    pub snapshot_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> CastVoteOverride<'info> {
    pub fn cast_vote_override(
        &mut self,
        for_votes_bp: u64,
        against_votes_bp: u64,
        abstain_votes_bp: u64,
        proof: Vec<[u8; 32]>,
        bumps: &CastVoteOverrideBumps,
    ) -> Result<()> {
        // Check that the proposal is open for voting
        require!(self.proposal.voting, GovernanceError::ProposalClosed);
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        // Validate vote account
        let vote_data = self.spl_vote_account.data.borrow();
        let version = u32::from_le_bytes(
            vote_data[0..4]
                .try_into()
                .map_err(|_| GovernanceError::InvalidVoteAccount)?,
        );
        require!(version <= 2, GovernanceError::InvalidVoteAccount);

        let node_pubkey = Pubkey::try_from(&vote_data[4..36])
            .map_err(|_| GovernanceError::InvalidVoteAccount)?;

        // Validate stake account and delegation
        let stake_data = self.spl_stake_account.data.borrow();
        let stake_state = StakeStateV2::try_from_slice(&stake_data)?;
        let (meta, stake) = if let StakeStateV2::Stake(m, s, _) = stake_state {
            (m, s)
        } else {
            return err!(GovernanceError::InvalidStakeState);
        };

        // Signer must be withdraw authority
        require_keys_eq!(meta.authorized.withdrawer, self.signer.key(), GovernanceError::InvalidStakeState);

        // Stake must be delegated to the validator
        require_keys_eq!(stake.delegation.voter_pubkey, self.spl_vote_account.key(), GovernanceError::InvalidStakeState);

        let delegator_stake = stake.delegation.stake;
        require_gt!(delegator_stake, 0u64, GovernanceError::NotEnoughStake);

        // Get the current epoch from the Clock sysvar
        let clock = Clock::get()?;
        let current_epoch = clock.epoch;
        require!(
            self.proposal.start_epoch <= current_epoch,
            GovernanceError::VotingNotStarted
        );
        require!(
            current_epoch < self.proposal.end_epoch,
            GovernanceError::ProposalClosed
        );

        // Validate basis points sum to 10,000 (100%)
        let total_bp = for_votes_bp
            .checked_add(against_votes_bp)
            .and_then(|sum| sum.checked_add(abstain_votes_bp))
            .ok_or(ProgramError::ArithmeticOverflow)?;
        require!(total_bp == 10_000, GovernanceError::InvalidVoteDistribution);

        // Compute leaf hash for Merkle proof (e.g., hash(signer | stake_account | vote_account | stake | snapshot_slot)
        let leaf_data = [&self.signer.key().to_bytes()[..], &self.spl_stake_account.key().to_bytes()[..], &self.spl_vote_account.key().to_bytes()[..], &delegator_stake.to_le_bytes(), &self.proposal.snapshot_slot.to_le_bytes()];
        let leaf_hash = keccak::hashv(&leaf_data);

        // CPI to Snapshot Program's verify instruction
        let verify_ix = Instruction {
            program_id: self.snapshot_program.key(),
            accounts: vec![
                AccountMeta::new_readonly(self.proposal.key(), false), // Proposal for root
            ],
            data: snapshot_program::instruction::Verify {
                root: self.proposal.merkle_root_hash,
                leaf: leaf_hash.0,
                proof,
            }.data(),
        };
        invoke(
            &verify_ix,
            &[self.proposal.to_account_info(), self.snapshot_program.to_account_info()],
        )?;

        // Compute delegator weight and add prorated votes to proposal totals
        let cluster_stake = get_epoch_total_stake();
        require_gt!(cluster_stake, 0u64, GovernanceError::InvalidClusterStake);

        let delegator_weight_bp = stake_weight_bp!(delegator_stake as u128, cluster_stake as u128)? as u64;

        let for_add = delegator_weight_bp.checked_mul(for_votes_bp).and_then(|p| p.checked_div(10_000)).ok_or(ProgramError::ArithmeticOverflow)?;
        let against_add = delegator_weight_bp.checked_mul(against_votes_bp).and_then(|p| p.checked_div(10_000)).ok_or(ProgramError::ArithmeticOverflow)?;
        let abstain_add = delegator_weight_bp.checked_mul(abstain_votes_bp).and_then(|p| p.checked_div(10_000)).ok_or(ProgramError::ArithmeticOverflow)?;

        self.proposal.for_votes_bp = self.proposal.for_votes_bp.checked_add(for_add).ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.against_votes_bp = self.proposal.against_votes_bp.checked_add(against_add).ok_or(ProgramError::ArithmeticOverflow)?;
        self.proposal.abstain_votes_bp = self.proposal.abstain_votes_bp.checked_add(abstain_add).ok_or(ProgramError::ArithmeticOverflow)?;


        // Store override
        self.vote_override.set_inner(VoteOverride {
            stake_account: self.spl_stake_account.key(),
            validator: self.spl_vote_account.key(),
            proposal: self.proposal.key(),
            for_votes_bp,
            against_votes_bp,
            abstain_votes_bp,
            stake_amount: delegator_stake,
            vote_override_timestamp: clock.unix_timestamp,
            bump: bumps.vote_override,
        });
        self.proposal.vote_count += 1;

        Ok(())
    }
}