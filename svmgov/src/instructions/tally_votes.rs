use std::str::FromStr;

use anchor_client::{
    solana_client::rpc_filter::{Memcmp, MemcmpEncodedBytes, RpcFilterType},
    solana_sdk::{pubkey::Pubkey, signer::Signer},
};
use anchor_lang::prelude::AccountMeta;
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use indicatif::{ProgressBar, ProgressStyle};
use log::info;

use crate::{
    govcontract::{
        accounts::{Proposal, Vote},
        client::{accounts, args},
    },
    setup_all,
    utils::utils::find_spl_vote_accounts,
};
pub async fn tally_votes(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    // Parse the proposal ID into a Pubkey
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    // Load identity keypair, set up cluster and rpc_client, find native vote accunt
    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;

    // Rpc filter to get Vote accounts for this proposal
    let filter = RpcFilterType::Memcmp(Memcmp::new(
        40,
        MemcmpEncodedBytes::Bytes(proposal_pubkey.to_bytes().to_vec()),
    ));

    // Create a spinner for progress indication
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap()
            .tick_strings(&["⠏", "⠇", "⠦", "⠴", "⠼", "⠸", "⠹", "⠙", "⠋", "⠓"]),
    );

    spinner.set_message("Gathering vote accounts, tallying votes...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    let vote_accounts = program.accounts::<Vote>(vec![filter]).await?;

    let mut batches = vote_accounts.len() / 10;

    if (vote_accounts.len() % 10) > 0 {
        batches += 1;
    }
    let mut finalize = false;

    // Tally the votes, 10 at a time
    for (index, votes_chunk) in vote_accounts.chunks(10).enumerate() {
        if index == (batches - 1) {
            finalize = true
        }

        let (votes, validator_keys) = votes_chunk
            .iter()
            .map(|(vote_pub, vote_struct)| {
                (
                    AccountMeta {
                        pubkey: *vote_pub,
                        is_signer: false,
                        is_writable: true,
                    },
                    &vote_struct.validator,
                )
            })
            .collect::<(Vec<_>, Vec<_>)>();

        let spl_vote_pubkeys = find_spl_vote_accounts(validator_keys, &program.rpc()).await?;

        let spl_vote_accounts = spl_vote_pubkeys
            .iter()
            .map(|spl_vote_pubkey| AccountMeta {
                pubkey: *spl_vote_pubkey,
                is_signer: false,
                is_writable: false,
            })
            .collect::<Vec<AccountMeta>>();

        let remaining_accounts = votes
            .into_iter()
            .zip(spl_vote_accounts.into_iter())
            .flat_map(|(vote, spl_vote)| [vote, spl_vote])
            .collect::<Vec<AccountMeta>>();

        let sig = program
            .request()
            .args(args::TallyVotes { finalize })
            .accounts(accounts::TallyVotes {
                signer: payer.pubkey(),
                spl_vote_account: vote_account,
                proposal: proposal_pubkey,
                system_program: system_program::ID,
            })
            // Remaining accounts
            .accounts(remaining_accounts)
            .send()
            .await?;

        info!("Tally votes: https://explorer.solana.com/tx/{}", sig);
    }
    let proposal = program.account::<Proposal>(proposal_pubkey).await?;

    spinner.finish_with_message(format!("Tally finished: {}", proposal));

    Ok(())
}
