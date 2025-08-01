use std::str::FromStr;

use crate::{
    govcontract::client::{accounts, args},
    setup_all,
};
use anchor_client::solana_sdk::{pubkey::Pubkey, signer::Signer};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};

pub async fn support_proposal(
    proposal_id: String,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    log::debug!(
        "support_proposal: proposal_id={}, identity_keypair={:?}, rpc_url={:?}",
        proposal_id,
        identity_keypair,
        rpc_url
    );

    let proposal_pubkey = match Pubkey::from_str(&proposal_id) {
        Ok(pubkey) => {
            log::debug!("Parsed proposal_pubkey: {}", pubkey);
            pubkey
        }
        Err(_) => {
            log::debug!("Invalid proposal_id: {}", proposal_id);
            return Err(anyhow!("Invalid proposal ID"));
        }
    };

    let (payer, vote_account, program) = setup_all(identity_keypair, rpc_url).await?;
    log::debug!(
        "setup_all complete: payer_pubkey={}, vote_account={}",
        payer.pubkey(),
        vote_account
    );

    let payer_pubkey = payer.pubkey();

    let support_seeds = &[b"support", proposal_pubkey.as_ref(), payer_pubkey.as_ref()];
    let (support_pda, _bump) = Pubkey::find_program_address(support_seeds, &program.id());
    log::debug!("Derived support_pda: {}", support_pda);

    log::debug!("Building and sending SupportProposal transaction");
    let sig = program
        .request()
        .args(args::SupportProposal {})
        .accounts(accounts::SupportProposal {
            signer: payer.pubkey(),
            spl_vote_account: vote_account,
            proposal: proposal_pubkey,
            support: support_pda,
            system_program: system_program::ID,
        })
        .send()
        .await?;
    log::debug!("Transaction sent successfully: signature={}", sig);

    println!("Proposal supported. https://explorer.solana.com/tx/{}", sig);

    Ok(())
}
