import { PublicKey } from "@solana/web3.js";
import { AddMerkleRootParams, TransactionResult } from "./types";
import { createProgramWithWallet, hexToBytes } from "./helpers";

/**
 * Adds a merkle root hash to a proposal
 */
export async function addMerkleRoot(params: AddMerkleRootParams): Promise<TransactionResult> {
  try {
    const { proposalId, merkleRootHash, wallet } = params;

    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const proposalPubkey = new PublicKey(proposalId);
    const program = createProgramWithWallet(wallet);

    // Convert hex string to byte array
    const merkleRootBytes = hexToBytes(merkleRootHash);

    // Build and send transaction
    const tx = await program.methods
      .addMerkleRoot(Array.from(merkleRootBytes))
      .accounts({
        signer: wallet.publicKey,
        proposal: proposalPubkey,
      })
      .rpc();

    return {
      signature: tx,
      success: true,
    };
  } catch (error) {
    console.error("Error adding merkle root:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
