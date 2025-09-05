import { SystemProgram } from "@solana/web3.js";
import { InitializeIndexParams, TransactionResult } from "./types";
import { createProgramWithWallet, deriveProposalIndexPda } from "./helpers";

/**
 * Initializes the proposal index
 */
export async function initializeIndex(params: InitializeIndexParams): Promise<TransactionResult> {
  try {
    const { wallet } = params;

    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const program = createProgramWithWallet(wallet);
    const proposalIndexPda = deriveProposalIndexPda(program.programId);

    // Build and send transaction
    const tx = await program.methods
      .initializeIndex()
      .accounts({
        signer: wallet.publicKey,
        proposalIndex: proposalIndexPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      signature: tx,
      success: true,
    };
  } catch (error) {
    console.error("Error initializing index:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
