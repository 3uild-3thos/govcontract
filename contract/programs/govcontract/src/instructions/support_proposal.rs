use anchor_lang::{
    prelude::*,
    solana_program::{
        epoch_stake::{get_epoch_stake_for_vote_account, get_epoch_total_stake},
        instruction::Instruction,
        program::invoke_signed,
        vote::{program as vote_program, state::VoteState},
    },
    ToAccountMetas,
};
use borsh::BorshSerialize;

use crate::{
    constants::*,
    error::GovernanceError,
    events::ProposalSupported,
    state::{Proposal, Support},
    utils::get_epoch_slot_range,
};

#[derive(Accounts)]
pub struct SupportProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Proposal supporter (validator)
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Support::INIT_SPACE,
        seeds = [b"support", proposal.key().as_ref(), spl_vote_account.key().as_ref()],
        bump
    )]
    pub support: Account<'info, Support>, // New support account
    /// CHECK: Vote account is too big to deserialize, so we check on owner and size, then compare node_pubkey with signer
    #[account(
        constraint = spl_vote_account.owner == &vote_program::ID @ ProgramError::InvalidAccountOwner,
        constraint = spl_vote_account.data_len() == VoteState::size_of() @ GovernanceError::InvalidVoteAccountSize
    )]
    pub spl_vote_account: UncheckedAccount<'info>,

    /// CHECK: Ballot box account - may or may not exist, checked with data_is_empty()
    #[account(mut)]
    pub ballot_box: UncheckedAccount<'info>,

    /// CHECK: Ballot program account
    #[account(
        constraint = ballot_program.key == &gov_v1::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub ballot_program: UncheckedAccount<'info>,

    /// CHECK: Program config account
    #[account(
        seeds = [b"ProgramConfig"],
        bump,
        seeds::program = ballot_program.key(),
        constraint = program_config.owner == &gov_v1::ID @ ProgramError::InvalidAccountOwner,
    )]
    pub program_config: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub struct InitBallotBox<'info> {
    pub payer: AccountInfo<'info>,
    pub proposal: AccountInfo<'info>,
    pub ballot_box: AccountInfo<'info>,
    pub program_config: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
}
impl<'info> SupportProposal<'info> {
    pub fn support_proposal(&mut self, bumps: &SupportProposalBumps) -> Result<()> {
        let clock = Clock::get()?;

        // Ensure proposal is eligible for support
        require!(
            self.proposal.voting == false && self.proposal.finalized == false,
            GovernanceError::ProposalClosed
        );
        require!(!self.proposal.finalized, GovernanceError::ProposalFinalized);

        require!(
            clock.epoch == self.proposal.creation_epoch + MAX_SUPPORT_EPOCHS,
            GovernanceError::SupportPeriodExpired
        );

        // assuming this returns in lamports
        let supporter_stake = get_epoch_stake_for_vote_account(self.spl_vote_account.key);

        // Add the supporter's stake (from verified leaf) to the proposal's cluster support
        self.proposal.add_cluster_support(supporter_stake)?;

        // Initialize the support account
        self.support.set_inner(Support {
            proposal: self.proposal.key(),
            validator: self.signer.key(),
            bump: bumps.support,
        });

        let cluster_stake = get_epoch_total_stake();
        let support_scaled =
            (self.proposal.cluster_support_lamports as u128) * CLUSTER_SUPPORT_MULTIPLIER;
        let cluster_scaled = (cluster_stake as u128) * CLUSTER_STAKE_MULTIPLIER;
        self.proposal.voting = if support_scaled >= cluster_scaled {
            let (start_slot, _) =
                get_epoch_slot_range(clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION);
            let snapshot_slot = start_slot + 1000;
            // start voting 1 epoch after snapshot
            // checking in any vote or others is start_epoch <= current_epoch < end_epoch
            self.proposal.start_epoch =
                clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION + 1;
            self.proposal.end_epoch =
                clock.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION + 1 + VOTING_EPOCHS;
            self.proposal.snapshot_slot = snapshot_slot; // 1000 slots into snapshot

            let (consensus_result_pda, _) = Pubkey::find_program_address(
                &[b"ConsensusResult", &snapshot_slot.to_le_bytes()],
                &self.ballot_program.key,
            );

            self.proposal.consensus_result = Some(consensus_result_pda);

            if self.ballot_box.data_is_empty() {
                // Create seed components with sufficient lifetime
                let proposal_seed_val = self.proposal.proposal_seed.to_le_bytes();
                let vote_account_key = self.proposal.vote_account_pubkey.key();

                msg!("{:?}", proposal_seed_val);
                msg!("{:?}", vote_account_key);

                let seeds: &[&[u8]] = &[
                    b"proposal".as_ref(),
                    &proposal_seed_val,
                    vote_account_key.as_ref(),
                ];
                let signer_seeds = &[&seeds[..]];

                // Build CPI accounts struct
                let cpi_accounts = vec![
                    AccountMeta::new(self.signer.key(), true),
                    AccountMeta::new(self.proposal.key(), true),
                    AccountMeta::new(self.ballot_box.key(), false),
                    AccountMeta::new(self.program_config.key(), false),
                    AccountMeta::new_readonly(self.system_program.key(), false),
                ];

                // Build instruction data: discriminator + args
                let mut instruction_data = Vec::new();
                // Add discriminator for init_ballot_box: [164, 20, 45, 213, 67, 43, 193, 212]
                instruction_data.extend_from_slice(&[164, 20, 45, 213, 67, 43, 193, 212]);
                // Serialize args using borsh: snapshot_slot (u64), proposal_seed (u64), vote_account_pubkey (Pubkey)
                snapshot_slot.serialize(&mut instruction_data)?;
                self.proposal
                    .proposal_seed
                    .serialize(&mut instruction_data)?;
                self.proposal
                    .vote_account_pubkey
                    .key()
                    .serialize(&mut instruction_data)?;

                // Create instruction
                let instruction = Instruction {
                    program_id: self.ballot_program.key(),
                    accounts: cpi_accounts,
                    data: instruction_data,
                };

                // Collect account infos in the same order as account metas
                let account_infos = &[
                    self.signer.to_account_info(),
                    self.proposal.to_account_info(),
                    self.ballot_box.to_account_info(),
                    self.program_config.to_account_info(),
                    self.system_program.to_account_info(),
                    self.ballot_program.to_account_info(),
                ];

                msg!("invoke");
                // Invoke with signer seeds
                invoke_signed(&instruction, account_infos, signer_seeds)?;
            }

            true
        } else {
            false
        };

        emit!(ProposalSupported {
            proposal_id: self.proposal.key(),
            supporter: self.signer.key(),
            cluster_support_lamports: self.proposal.cluster_support_lamports,
            voting_activated: self.proposal.voting,
            snapshot_slot: self.proposal.snapshot_slot,
        });

        Ok(())
    }
}
