import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  ModifyVoteOverrideParams,
  TransactionResult,
  BlockchainParams,
  SNAPSHOT_PROGRAM_ID,
} from "./types";
import {
  createProgramWithWallet,
  createGovV1ProgramWithWallet,
  getVoteAccountProof,
  getStakeAccountProof,
  generatePdasFromVoteProofResponse,
  convertMerkleProofStrings,
  convertStakeMerkleLeafDataToIdlType,
  validateVoteBasisPoints,
  deriveVoteOverridePda,
  deriveVoteOverrideCachePda,
  deriveVotePda,
} from "./helpers";
import { BN } from "@coral-xyz/anchor";

/**
 * Modifies an existing vote override using a stake account
 */
export async function modifyVoteOverride(
  params: ModifyVoteOverrideParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined
): Promise<TransactionResult> {
  const {
    proposalId,
    forVotesBp,
    againstVotesBp,
    abstainVotesBp,
    stakeAccount,
    wallet,
    voteAccount,
    ballotId,
  } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  if (slot === undefined) {
    throw new Error("Slot is not defined");
  }

  // Validate vote distribution
  validateVoteBasisPoints(forVotesBp, againstVotesBp, abstainVotesBp);

  const proposalPubkey = new PublicKey(proposalId);
  const splVoteAccount = new PublicKey(voteAccount);
  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

  const stakeAccountPubkey = new PublicKey(stakeAccount);

  // Get proofs
  const network = blockchainParams.network || "mainnet";
  const [metaMerkleProof, stakeMerkleProof] = await Promise.all([
    getVoteAccountProof(splVoteAccount.toBase58(), network, slot),
    getStakeAccountProof(stakeAccount, network, slot),
  ]);

  const [consensusResultPda, metaMerkleProofPda] =
    generatePdasFromVoteProofResponse(
      metaMerkleProof,
      SNAPSHOT_PROGRAM_ID,
      ballotId
    );

  // Check if merkle account exists
  const merkleAccountInfo = await program.provider.connection.getAccountInfo(
    metaMerkleProofPda,
    "confirmed"
  );

  if (!merkleAccountInfo) {
    console.log("merkle proof does not exist, initializing");
    const govV1Program = createGovV1ProgramWithWallet(
      wallet,
      blockchainParams.endpoint
    );

    const stakeMerkleRootData = Array.from(
      new PublicKey(
        metaMerkleProof.meta_merkle_leaf.stake_merkle_root
      ).toBytes()
    );

    const metaMerkleProofData = metaMerkleProof.meta_merkle_proof.map((proof) =>
      Array.from(new PublicKey(proof).toBytes())
    );

    const initMerkleInstruction = await govV1Program.methods
      .initMetaMerkleProof(
        {
          votingWallet: new PublicKey(
            metaMerkleProof.meta_merkle_leaf.voting_wallet
          ),
          voteAccount: new PublicKey(
            metaMerkleProof.meta_merkle_leaf.vote_account
          ),
          stakeMerkleRoot: stakeMerkleRootData,
          activeStake: new BN(
            `${metaMerkleProof.meta_merkle_leaf.active_stake}`
          ),
        },
        metaMerkleProofData,
        new BN(1)
      )
      .accountsStrict({
        consensusResult: consensusResultPda,
        merkleProof: metaMerkleProofPda,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const recentBlockhash =
      await program.provider.connection.getLatestBlockhash("confirmed");

    const transaction = new Transaction();
    transaction.add(initMerkleInstruction);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = recentBlockhash.blockhash;

    const tx = await wallet.signTransaction(transaction);

    const signature = await program.provider.connection.sendRawTransaction(
      tx.serialize(),
      { preflightCommitment: "confirmed" }
    );
    console.log("signature initMerkleInstruction", signature);
  }

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

  const votePda = deriveVotePda(
    proposalPubkey,
    splVoteAccount,
    program.programId
  );

  const voteOverridePda = deriveVoteOverridePda(
    proposalPubkey,
    stakeAccountPubkey,
    votePda,
    program.programId
  );

  const voteOverrideCachePda = deriveVoteOverrideCachePda(
    proposalPubkey,
    votePda,
    program.programId
  );

  // Build modify vote override instruction
  const modifyVoteOverrideInstruction = await program.methods
    .modifyVoteOverride(
      forVotesBn,
      againstVotesBn,
      abstainVotesBn,
      stakeMerkleProofVec,
      stakeMerkleLeaf
    )
    .accountsStrict({
      signer: wallet.publicKey,
      splVoteAccount: splVoteAccount,
      splStakeAccount: stakeAccountPubkey,
      proposal: proposalPubkey,
      consensusResult: consensusResultPda,
      metaMerkleProof: metaMerkleProofPda,
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      voteOverride: voteOverridePda,
      voteOverrideCache: voteOverrideCachePda,
      validatorVote: votePda,
    })
    .instruction();

  const transaction = new Transaction();
  transaction.add(modifyVoteOverrideInstruction);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await program.provider.connection.getLatestBlockhash("confirmed")
  ).blockhash;

  const tx = await wallet.signTransaction(transaction);

  //   error mutating modify vote: SendTransactionError: Simulation failed.
  // Message: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x177c.
  // Logs:
  // [
  //   "Program 3GBS7ZjQV5cKfsazbA2CSGm8kVQjjT6ow9XxZtSxRH3G invoke [1]",
  //   "Program log: Instruction: ModifyVoteOverride",
  //   "Program F3ZY8uXns4UDorFc9FASojnecMTq5yT5QakrjdocxTLF invoke [2]",
  //   "Program log: Instruction: VerifyMerkleProof",
  //   "Program F3ZY8uXns4UDorFc9FASojnecMTq5yT5QakrjdocxTLF consumed 7250 of 182371 compute units",
  //   "Program F3ZY8uXns4UDorFc9FASojnecMTq5yT5QakrjdocxTLF success",
  //   "Program log: AnchorError thrown in programs/govcontract/src/instructions/modify_vote_override.rs:218. Error Code: InvalidVoteAccount. Error Number: 6012. Error Message: Invalid vote account, proposal id mismatch.",
  //   "Program 3GBS7ZjQV5cKfsazbA2CSGm8kVQjjT6ow9XxZtSxRH3G consumed 27902 of 200000 compute units",
  //   "Program 3GBS7ZjQV5cKfsazbA2CSGm8kVQjjT6ow9XxZtSxRH3G failed: custom program error: 0x177c"
  // ].
  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize(),
    { preflightCommitment: "confirmed" }
  );

  console.log("signature modify vote override", signature);

  return {
    signature,
    success: true,
  };
}
