import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { SupportProposalParams, TransactionResult } from "./types";
import {
  createProgramWithWallet,
  deriveSupportPda,
  deriveConsensusResultPda,
  deriveMetaMerkleProofPda,
} from "./helpers";

/**
 * Supports a governance proposal
 */
export async function supportProposal(
  params: SupportProposalParams
): Promise<TransactionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proposalId, wallet, voteAccount } = params;

    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const proposalPubkey = new PublicKey(proposalId);
    // const splVoteAccount = voteAccount || wallet.publicKey;
    const program = createProgramWithWallet(
      wallet,
      params.programId,
      params.endpoint
    );

    // Derive support PDA - based on IDL, it uses proposal and signer
    const supportPda = deriveSupportPda(
      proposalPubkey,
      wallet.publicKey,
      program.programId
    );

    // Create dummy snapshot accounts for testing (matching test pattern)
    const SNAPSHOT_PROGRAM_ID = new PublicKey(
      "11111111111111111111111111111111"
    );
    const snapshotSlot = new BN(1000000); // Dummy snapshot slot
    const consensusResult = deriveConsensusResultPda(
      snapshotSlot,
      SNAPSHOT_PROGRAM_ID
    );
    const metaMerkleProof = deriveMetaMerkleProofPda(
      consensusResult,
      wallet.publicKey,
      SNAPSHOT_PROGRAM_ID
    );

    // Build and send transaction using accountsPartial like in tests
    const tx = await program.methods
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
      .rpc();

    return {
      signature: tx,
      success: true,
    };
  } catch (error) {
    console.error("Error supporting proposal:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
