import { PublicKey, SystemProgram } from "@solana/web3.js";
import { CastVoteOverrideParams, TransactionResult, SNAPSHOT_PROGRAM_ID } from "./types";
import {
  createProgramWithWallet,
  deriveVotePda,
  deriveVoteOverridePda,
  getVoteAccountProof,
  getStakeAccountProof,
  getVoterSummary,
  generatePdasFromVoteProofResponse,
  convertMerkleProofStrings,
  convertStakeMerkleLeafDataToIdlType,
  validateVoteBasisPoints,
} from "./helpers";

/**
 * Casts a vote override using a stake account
 */
export async function castVoteOverride(params: CastVoteOverrideParams): Promise<TransactionResult> {
  try {
    const {
      proposalId,
      forVotesBp,
      againstVotesBp,
      abstainVotesBp,
      stakeAccount,
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

    // Determine stake account to use
    let stakeAccountStr = stakeAccount;
    if (!stakeAccountStr) {
      try {
        const voterSummary = await getVoterSummary(wallet.publicKey.toString());
        if (!voterSummary.stake_accounts || voterSummary.stake_accounts.length === 0) {
          throw new Error("No stake account found for voter");
        }
        stakeAccountStr = voterSummary.stake_accounts[0].stake_account;
      } catch (error) {
        throw new Error(`Failed to get stake account: ${error}`);
      }
    }

    const stakeAccountPubkey = new PublicKey(stakeAccountStr);

    // Get proofs
    const [metaMerkleProof, stakeMerkleProof] = await Promise.all([
      getVoteAccountProof(splVoteAccount.toString()),
      getStakeAccountProof(stakeAccountStr),
    ]);

    const [consensusResultPda, metaMerkleProofPda] = generatePdasFromVoteProofResponse(metaMerkleProof);

    // Derive PDAs
    const validatorVotePda = deriveVotePda(proposalPubkey, splVoteAccount, program.programId);
    const voteOverridePda = deriveVoteOverridePda(
      proposalPubkey,
      stakeAccountPubkey,
      validatorVotePda,
      program.programId
    );

    // Convert merkle proof data
    const stakeMerkleProofVec = convertMerkleProofStrings(stakeMerkleProof.stake_merkle_proof);
    const stakeMerkleLeaf = convertStakeMerkleLeafDataToIdlType(stakeMerkleProof.stake_merkle_leaf);

    // Build and send transaction
    const tx = await program.methods
      .castVoteOverride(
        forVotesBp,
        againstVotesBp,
        abstainVotesBp,
        stakeMerkleProofVec,
        stakeMerkleLeaf
      )
      .accounts({
        signer: wallet.publicKey,
        splVoteAccount: splVoteAccount,
        splStakeAccount: stakeAccountPubkey,
        proposal: proposalPubkey,
        validatorVote: validatorVotePda,
        voteOverride: voteOverridePda,
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
    console.error("Error casting vote override:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
