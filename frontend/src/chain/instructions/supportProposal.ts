import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  BlockchainParams,
  SupportProposalParams,
  TransactionResult,
  SNAPSHOT_PROGRAM_ID,
} from "./types";
import {
  createProgramWithWallet,
  deriveSupportPda,
  getVoteAccountProof,
} from "./helpers";

/**
 * Supports a governance proposal
 */
export async function supportProposal(
  params: SupportProposalParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined
): Promise<TransactionResult> {
  const { proposalId, wallet } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  if (slot === undefined) {
    throw new Error("Slot is not defined");
  }

  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

  const voteAccounts = await program.provider.connection.getVoteAccounts();
  const validatorVoteAccount = voteAccounts.current.find(
    (acc) => acc.nodePubkey === wallet.publicKey.toBase58()
  );

  const proposalPubkey = new PublicKey(proposalId);

  if (!validatorVoteAccount) {
    throw new Error(
      `No SPL vote account found for validator identity ${wallet.publicKey.toBase58()}`
    );
  }
  // Derive support PDA - based on IDL, it uses proposal and signer
  const supportPda = deriveSupportPda(
    proposalPubkey,
    new PublicKey(validatorVoteAccount.votePubkey),
    program.programId
  );

  const voteAccountProof = await getVoteAccountProof(
    validatorVoteAccount.votePubkey,
    blockchainParams.network,
    slot
  );
  console.log("fetched voteAccountProof", voteAccountProof);

  const DISCUSSION_EPOCHS = 4;
  const SNAPSHOT_EPOCH_EXTENSION = 1;

  const epochInfo = await program.provider.connection.getEpochInfo();
  const targetEpoch =
    epochInfo.epoch + DISCUSSION_EPOCHS + SNAPSHOT_EPOCH_EXTENSION;

  const epochSchedule = await program.provider.connection.getEpochSchedule();
  const startSlot = epochSchedule.getFirstSlotInEpoch(targetEpoch);
  const snapshotSlot = startSlot + 1000;

  const seeds = [
    Buffer.from("BallotBox"),
    new BN(snapshotSlot).toArrayLike(Buffer, "le", 8),
  ];
  const [ballotBoxPda] = PublicKey.findProgramAddressSync(
    seeds,
    SNAPSHOT_PROGRAM_ID
  );

  // Build support proposal instruction
  const supportProposalInstruction = await program.methods
    .supportProposal()
    .accountsStrict({
      signer: wallet.publicKey,
      proposal: proposalPubkey,
      support: supportPda,
      splVoteAccount: new PublicKey(validatorVoteAccount.votePubkey),
      systemProgram: SystemProgram.programId,
      ballotBox: ballotBoxPda,
      ballotProgram: SNAPSHOT_PROGRAM_ID,
    })
    .instruction();

  const transaction = new Transaction();
  transaction.add(supportProposalInstruction);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await program.provider.connection.getLatestBlockhash("confirmed")
  ).blockhash;

  const tx = await wallet.signTransaction(transaction);

  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize()
  );

  console.log("signature support proposal", signature);

  return {
    signature,
    success: true,
  };
}
