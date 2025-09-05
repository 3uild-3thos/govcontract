import { PublicKey, SystemProgram } from "@solana/web3.js";
import { SupportProposalParams, TransactionResult, SNAPSHOT_PROGRAM_ID } from "./types";
import {
  createProgramWithWallet,
  deriveSupportPda,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
} from "./helpers";

/**
 * Supports a governance proposal
 */
export async function supportProposal(params: SupportProposalParams): Promise<TransactionResult> {
  try {
    const { proposalId, wallet, voteAccount } = params;

    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const proposalPubkey = new PublicKey(proposalId);
    const splVoteAccount = voteAccount || wallet.publicKey;
    const program = createProgramWithWallet(wallet);

    // Derive support PDA
    const supportPda = deriveSupportPda(proposalPubkey, splVoteAccount, program.programId);

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
      .supportProposal()
      .accounts({
        signer: wallet.publicKey,
        proposal: proposalPubkey,
        support: supportPda,
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
    console.error("Error supporting proposal:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
