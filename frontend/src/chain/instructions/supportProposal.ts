import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  BlockchainParams,
  SupportProposalParams,
  TransactionResult,
} from "./types";
import {
  createProgramWithWallet,
  deriveSupportPda,
  getVoterSummary,
  getVoteAccountProof,
} from "./helpers";

/**
 * Supports a governance proposal
 */
export async function supportProposal(
  params: SupportProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> {
  const { proposalId, wallet } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const voterSummary = await getVoterSummary(
    wallet.publicKey.toString(),
    blockchainParams.network || "mainnet"
  );
  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

  const voteAccounts = await program.provider.connection.getVoteAccounts();
  const validatorVoteAccount = voteAccounts.current.find(
    (acc) => acc.nodePubkey === wallet.publicKey.toBase58()
  );
  const slot = voterSummary.snapshot_slot;

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

  // Build support proposal instruction
  const supportProposalInstruction = await program.methods
    .supportProposal()
    .accountsStrict({
      signer: wallet.publicKey,
      proposal: proposalPubkey,
      support: supportPda,
      splVoteAccount: new PublicKey(validatorVoteAccount.votePubkey),
      systemProgram: SystemProgram.programId,
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
