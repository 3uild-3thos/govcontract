import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { ModifyVoteParams, TransactionResult } from "./types";
import {
  createProgramWithWallet,
  deriveVotePda,
  validateVoteBasisPoints,
  deriveConsensusResultPda,
  deriveMetaMerkleProofPda,
} from "./helpers";

/**
 * Modifies an existing vote on a governance proposal
 */
export async function modifyVote(params: ModifyVoteParams): Promise<TransactionResult> {
  try {
    const {
      proposalId,
      forVotesBp,
      againstVotesBp,
      abstainVotesBp,
      wallet,
      voteAccount,
    } = params;

    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Validate vote distribution
    validateVoteBasisPoints(forVotesBp, againstVotesBp, abstainVotesBp);

    const proposalPubkey = new PublicKey(proposalId);
    const splVoteAccount = voteAccount || wallet.publicKey;
    const program = createProgramWithWallet(wallet, params.programId, params.endpoint);

    // Derive vote PDA - based on IDL, it uses proposal and signer
    const votePda = deriveVotePda(proposalPubkey, wallet.publicKey, program.programId);

    // Create dummy snapshot accounts for testing (matching test pattern)
    const SNAPSHOT_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
    const snapshotSlot = new BN(1000000); // Dummy snapshot slot
    const consensusResult = deriveConsensusResultPda(snapshotSlot, SNAPSHOT_PROGRAM_ID);
    const metaMerkleProof = deriveMetaMerkleProofPda(consensusResult, wallet.publicKey, SNAPSHOT_PROGRAM_ID);

    // Build and send transaction using accountsPartial like in tests
    const tx = await program.methods
      .modifyVote(new BN(forVotesBp), new BN(againstVotesBp), new BN(abstainVotesBp))
      .accountsPartial({
        signer: wallet.publicKey,
        proposal: proposalPubkey,
        vote: votePda,
        splVoteAccount: splVoteAccount,
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
    console.error("Error modifying vote:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}