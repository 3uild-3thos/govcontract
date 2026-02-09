use std::str::FromStr;

use anchor_client::solana_sdk::{
    hash::hash,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signer::Signer,
    transaction::Transaction,
};
use anchor_lang::system_program;
use anyhow::{Result, anyhow};
use gov_v1::ID as SNAPSHOT_PROGRAM_ID;

use crate::utils::utils::{create_spinner, derive_program_config_pda, setup_all};

fn anchor_ix_discriminator(ix_name: &str) -> [u8; 8] {
    // Anchor discriminator = first 8 bytes of sha256("global:<ix_name>")
    let preimage = format!("global:{ix_name}");
    let h = hash(preimage.as_bytes()).to_bytes();
    let mut out = [0u8; 8];
    out.copy_from_slice(&h[..8]);
    out
}

pub async fn admin_set_snapshot_slot(
    proposal_id: String,
    snapshot_slot: u64,
    identity_keypair: Option<String>,
    rpc_url: Option<String>,
) -> Result<()> {
    let proposal_pubkey = Pubkey::from_str(&proposal_id)
        .map_err(|_| anyhow!("Invalid proposal ID: {}", proposal_id))?;

    let (payer, _vote_account, program, _merkle_proof_program) =
        setup_all(identity_keypair, rpc_url).await?;

    // gov-v1 BallotBox PDA uses seeds: ["BallotBox", snapshot_slot_le_bytes]
    let ballot_box_pda = {
        let seeds = &[b"BallotBox".as_ref(), &snapshot_slot.to_le_bytes()];
        let (pda, _) = Pubkey::find_program_address(seeds, &SNAPSHOT_PROGRAM_ID);
        pda
    };

    let program_config_pda = derive_program_config_pda(&SNAPSHOT_PROGRAM_ID);

    let mut data = Vec::with_capacity(8 + 8);
    data.extend_from_slice(&anchor_ix_discriminator("admin_set_snapshot_slot"));
    data.extend_from_slice(&snapshot_slot.to_le_bytes());

    let ix = Instruction {
        program_id: program.id(),
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),              // signer (payer)
            AccountMeta::new(proposal_pubkey, false),            // proposal (writable)
            AccountMeta::new(ballot_box_pda, false),             // ballot_box (writable)
            AccountMeta::new_readonly(SNAPSHOT_PROGRAM_ID, false), // ballot_program
            AccountMeta::new_readonly(program_config_pda, false),  // program_config
            AccountMeta::new_readonly(system_program::ID, false),  // system_program
        ],
        data,
    };

    let spinner = create_spinner("Setting snapshot slot (admin)...");

    let blockhash = program.rpc().get_latest_blockhash().await?;
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[payer.as_ref()],
        blockhash,
    );

    let sig = program.rpc().send_and_confirm_transaction(&tx).await?;

    spinner.finish_with_message(format!(
        "Snapshot slot updated. https://explorer.solana.com/tx/{}",
        sig
    ));

    Ok(())
}

