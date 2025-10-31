import { PublicKey } from "@solana/web3.js";
import {
  CastVoteOverrideParams,
  TransactionResult,
  SNAPSHOT_PROGRAM_ID,
  BlockchainParams,
} from "./types";
import {
  createProgramWithWallet,
  // deriveVotePda,
  // deriveVoteOverridePda,
  getVoteAccountProof,
  getStakeAccountProof,
  getVoterSummary,
  generatePdasFromVoteProofResponse,
  convertMerkleProofStrings,
  convertStakeMerkleLeafDataToIdlType,
  validateVoteBasisPoints,
} from "./helpers";
import { BN } from "bn.js";

/**
 * Casts a vote override using a stake account
 */
export async function castVoteOverride(
  params: CastVoteOverrideParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> {
  const {
    proposalId,
    forVotesBp,
    againstVotesBp,
    abstainVotesBp,
    stakeAccount,
    wallet,
    voteAccount,
  } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Validate vote distribution
  validateVoteBasisPoints(forVotesBp, againstVotesBp, abstainVotesBp);

  const proposalPubkey = new PublicKey(proposalId);
  const splVoteAccount = voteAccount;
  const program = createProgramWithWallet(wallet);

  // Determine stake account to use
  let stakeAccountStr = stakeAccount;
  if (!stakeAccountStr) {
    try {
      const voterSummary = await getVoterSummary(
        wallet.publicKey.toString(),
        blockchainParams.network || "mainnet"
      );
      if (
        !voterSummary.stake_accounts ||
        voterSummary.stake_accounts.length === 0
      ) {
        throw new Error("No stake account found for voter");
      }
      // TODO: JUAN fix this type casting
      stakeAccountStr = voterSummary.stake_accounts[0].stake_account as string;
    } catch (error) {
      throw new Error(`Failed to get stake account: ${error}`);
    }
  }

  const stakeAccountPubkey = new PublicKey(stakeAccountStr);

  // Get proofs
  const network = blockchainParams.network || "mainnet";
  const [metaMerkleProof, stakeMerkleProof] = await Promise.all([
    getVoteAccountProof(splVoteAccount, network),
    getStakeAccountProof(stakeAccountStr, network),
  ]);

  const [consensusResultPda, metaMerkleProofPda] =
    generatePdasFromVoteProofResponse(metaMerkleProof);

  // Derive PDAs

  // TODO: JUAN check if these are really necessary, typescript is complaining about not needing them in the code below
  // const validatorVotePda = deriveVotePda(
  //   proposalPubkey,
  //   splVoteAccount,
  //   program.programId
  // );
  // const voteOverridePda = deriveVoteOverridePda(
  //   proposalPubkey,
  //   stakeAccountPubkey,
  //   validatorVotePda,
  //   program.programId
  // );

  // Convert merkle proof data
  const stakeMerkleProofVec = convertMerkleProofStrings(
    stakeMerkleProof.stake_merkle_proof
  );
  const stakeMerkleLeaf = convertStakeMerkleLeafDataToIdlType(
    stakeMerkleProof.stake_merkle_leaf
  );

  const forVotesBn = new BN(forVotesBp);
  const againstVotesBn = new BN(againstVotesBp);
  const abstainVotesBn = new BN(abstainVotesBp);

  // Build and send transaction
  const tx = await program.methods
    .castVoteOverride(
      forVotesBn,
      againstVotesBn,
      abstainVotesBn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stakeMerkleProofVec.map((proof) => proof.toBytes() as any), // TODO: JUAN fix this please, not sure whats going on
      stakeMerkleLeaf
    )
    .accounts({
      signer: wallet.publicKey,
      splVoteAccount: splVoteAccount,
      splStakeAccount: stakeAccountPubkey,
      proposal: proposalPubkey,
      // TODO: JUAN check if these are really necessary, typescript is complaining about not needing them
      // validatorVote: validatorVotePda,
      // voteOverride: voteOverridePda,
      consensusResult: consensusResultPda,
      metaMerkleProof: metaMerkleProofPda,
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
      // systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    signature: tx,
    success: true,
  };
}
