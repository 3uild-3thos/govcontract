import { PublicKey } from "@solana/web3.js";
import {
  BlockchainParams,
  FinalizeProposalParams,
  TransactionResult,
} from "./types";
import { createProgramWithWallet } from "./helpers";

/**
 * Finalizes a governance proposal
 */
export async function finalizeProposal(
  params: FinalizeProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> {
  try {
    const { proposalId, wallet } = params;

    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const proposalPubkey = new PublicKey(proposalId);
    const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

    // Build and send transaction
    const tx = await program.methods
      .finalizeProposal()
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
    console.error("Error finalizing proposal:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
