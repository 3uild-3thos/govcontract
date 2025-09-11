import { SystemProgram, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { CreateProposalParams, TransactionResult } from "./types";
import { 
  createProgramWithWallet, 
  deriveProposalPda, 
  deriveConsensusResultPda, 
  deriveMetaMerkleProofPda 
} from "./helpers";

/**
 * Creates a new governance proposal
 */
export async function createProposal(params: CreateProposalParams): Promise<TransactionResult> {
  try {
    const {
      title,
      description,
      startEpoch,
      votingLengthEpochs,
      seed,
      wallet,
      voteAccount,
    } = params;

    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Generate random seed if not provided
    const seedValue = new BN(seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    
    // Use provided vote account or wallet's public key as fallback
    const splVoteAccount = voteAccount || wallet.publicKey;

    const program = createProgramWithWallet(wallet, params.programId, params.endpoint);
    
    // Derive proposal PDA using the test pattern
    const proposalPda = deriveProposalPda(seedValue, wallet.publicKey, program.programId);

    // Create dummy snapshot accounts for testing (matching test pattern)
    const SNAPSHOT_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
    const snapshotSlot = new BN(1000000); // Dummy snapshot slot
    const consensusResult = deriveConsensusResultPda(snapshotSlot, SNAPSHOT_PROGRAM_ID);
    const metaMerkleProof = deriveMetaMerkleProofPda(consensusResult, wallet.publicKey, SNAPSHOT_PROGRAM_ID);

    // Build and send transaction using accountsPartial like in tests
    const tx = await program.methods
      .createProposal(
        seedValue,
        title,
        description,
        new BN(startEpoch),
        new BN(votingLengthEpochs)
      )
      .accountsPartial({
        signer: wallet.publicKey,
        proposal: proposalPda,
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
    console.error("Error creating proposal:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
