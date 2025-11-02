/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  BlockchainParams,
  SupportProposalParams,
  GOV_V1_PROGRAM_ID,
  TransactionResult,
} from "./types";
import {
  createProgramWithWallet,
  deriveSupportPda,
  deriveConsensusResultPda,
  deriveMetaMerkleProofPda,
  getVoterSummary,
  createGovV1ProgramWithWallet,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
} from "./helpers";

/**
 * Supports a governance proposal
 */
export async function supportProposal(
  params: SupportProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> {
  const { proposalId, wallet, voteAccount } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const voterSummary = await getVoterSummary(
    wallet.publicKey.toString(),
    blockchainParams.network || "mainnet"
  );
  const slot = voterSummary.snapshot_slot;

  const proposalPubkey = new PublicKey(proposalId);
  const splVoteAccount = voteAccount || wallet.publicKey;
  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

  // Derive support PDA - based on IDL, it uses proposal and signer
  const supportPda = deriveSupportPda(
    proposalPubkey,
    wallet.publicKey,
    program.programId
  );

  // Create snapshot accounts using GOV_V1_PROGRAM_ID
  const SNAPSHOT_PROGRAM_ID = GOV_V1_PROGRAM_ID;
  const snapshotSlot = new BN(slot);

  const consensusResult = deriveConsensusResultPda(
    snapshotSlot,
    SNAPSHOT_PROGRAM_ID
  );
  const metaMerkleProof = deriveMetaMerkleProofPda(
    consensusResult,
    wallet.publicKey,
    SNAPSHOT_PROGRAM_ID
  );

  const merkleAccountInfo = await program.provider.connection.getAccountInfo(
    metaMerkleProof,
    "confirmed"
  );

  const instructions: TransactionInstruction[] = [];

  if (merkleAccountInfo === null) {
    const govV1Program = createGovV1ProgramWithWallet(
      wallet,
      blockchainParams.endpoint
    );

    const voteAccountProof = await getVoteAccountProof(
      splVoteAccount.toBase58(),
      blockchainParams.network,
      slot
    );
    console.log("fetched voteAccountProof", voteAccountProof);

    const [consensusResultPda, metaMerkleProofPda] =
      generatePdasFromVoteProofResponse(voteAccountProof);

    const initMerkleInstruction = await govV1Program.methods
      .initMetaMerkleProof(
        {
          activeStake: voteAccountProof.meta_merkle_leaf.active_stake,
          votingWallet: voteAccountProof.meta_merkle_leaf.voting_wallet,
          stakeMerkleRoot: voteAccountProof.meta_merkle_leaf.stake_merkle_root,
          voteAccount: voteAccountProof.meta_merkle_leaf.vote_account,
        } as any,
        voteAccountProof.meta_merkle_proof as any,
        new BN(1)
      )
      .accountsStrict({
        consensusResult: consensusResultPda,
        merkleProof: metaMerkleProofPda,
        payer: wallet.publicKey,
        systemProgram: SNAPSHOT_PROGRAM_ID,
      })
      .instruction();

    instructions.push(initMerkleInstruction);
  }

  // Build support proposal instruction
  const supportProposalInstruction = await program.methods
    .supportProposal()
    .accountsPartial({
      signer: wallet.publicKey,
      proposal: proposalPubkey,
      support: supportPda,
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
      consensusResult,
      metaMerkleProof,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  instructions.push(supportProposalInstruction);

  const transaction = new Transaction();
  transaction.add(...instructions);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await program.provider.connection.getLatestBlockhash("confirmed")
  ).blockhash;

  const tx = await wallet.signTransaction(transaction);

  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize()
  );

  return {
    signature,
    success: true,
  };
}
