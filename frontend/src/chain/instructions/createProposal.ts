import { PublicKey, SystemProgram } from "@solana/web3.js";
import { CreateProposalParams, TransactionResult, SNAPSHOT_PROGRAM_ID } from "./types";
import {
  createProgramWithWallet,
  deriveProposalPda,
  deriveProposalIndexPda,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
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
    const seedValue = seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    
    // Use provided vote account or wallet's public key as fallback
    const splVoteAccount = voteAccount || wallet.publicKey;

    const program = createProgramWithWallet(wallet, params.programId);
    
    // Derive PDAs
    const proposalPda = deriveProposalPda(seedValue, splVoteAccount, program.programId);
    const proposalIndexPda = deriveProposalIndexPda(program.programId);

    // Get vote account proof (this would need to be implemented based on your API)
    let consensusResultPda: PublicKey;
    let metaMerkleProofPda: PublicKey;
    
    try {
      const proofResponse = await getVoteAccountProof(splVoteAccount.toString());
      
      // Validate that the voting wallet matches the signer
      if (proofResponse.meta_merkle_leaf.voting_wallet !== wallet.publicKey.toString()) {
        throw new Error(
          `Voting wallet in proof (${proofResponse.meta_merkle_leaf.voting_wallet}) doesn't match signer (${wallet.publicKey.toString()})`
        );
      }
      
      [consensusResultPda, metaMerkleProofPda] = generatePdasFromVoteProofResponse(proofResponse);
    } catch (error) {
      // Fallback to dummy PDAs if API is not available
      console.warn("Could not get vote account proof, using dummy PDAs:", error);
      consensusResultPda = new PublicKey("11111111111111111111111111111111");
      metaMerkleProofPda = new PublicKey("11111111111111111111111111111111");
    }

    // Build and send transaction
    const tx = await program.methods
      .createProposal(
        seedValue,
        title,
        description,
        startEpoch,
        votingLengthEpochs
      )
      .accounts({
        signer: wallet.publicKey,
        splVoteAccount: splVoteAccount,
        proposal: proposalPda,
        proposalIndex: proposalIndexPda,
        snapshotProgram: SNAPSHOT_PROGRAM_ID,
        consensusResult: consensusResultPda,
        metaMerkleProof: metaMerkleProofPda,
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
