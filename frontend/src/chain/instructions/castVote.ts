import { PublicKey, SystemProgram } from "@solana/web3.js";
import { CastVoteParams, TransactionResult, SNAPSHOT_PROGRAM_ID } from "./types";
import {
  createProgramWithWallet,
  deriveVotePda,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
  validateVoteBasisPoints,
} from "./helpers";

/**
 * Casts a vote on a governance proposal
 */
export async function castVote(params: CastVoteParams): Promise<TransactionResult> {
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
    const program = createProgramWithWallet(wallet);

    // Derive vote PDA
    const votePda = deriveVotePda(proposalPubkey, splVoteAccount, program.programId);

    // Get vote account proof
    let consensusResultPda: PublicKey;
    let metaMerkleProofPda: PublicKey;
    
    try {
      const proofResponse = await getVoteAccountProof(splVoteAccount.toString());
      [consensusResultPda, metaMerkleProofPda] = generatePdasFromVoteProofResponse(proofResponse);
    } catch (error) {
      // Fallback to dummy PDAs if API is not available
      console.warn("Could not get vote account proof, using dummy PDAs:", error);
      consensusResultPda = new PublicKey("11111111111111111111111111111111");
      metaMerkleProofPda = new PublicKey("11111111111111111111111111111111");
    }

    // Build and send transaction
    const tx = await program.methods
      .castVote(forVotesBp, againstVotesBp, abstainVotesBp)
      .accounts({
        signer: wallet.publicKey,
        splVoteAccount: splVoteAccount,
        proposal: proposalPubkey,
        vote: votePda,
        consensusResult: consensusResultPda,
        metaMerkleProof: metaMerkleProofPda,
        snapshotProgram: SNAPSHOT_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      signature: tx,
      success: true,
    };
  } catch (error) {
    console.error("Error casting vote:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
