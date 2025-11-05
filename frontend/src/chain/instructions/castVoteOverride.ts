import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  CastVoteOverrideParams,
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
} from "./helpers";
import { BN } from "@coral-xyz/anchor";

/**
 * Casts a vote override using a stake account
 */
export async function castVoteOverride(
  params: CastVoteOverrideParams,
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
  const network = blockchainParams.network;
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

  // Build cast vote override instruction
  const castVoteOverrideInstruction = await program.methods
    .castVoteOverride(
      forVotesBn,
      againstVotesBn,
      abstainVotesBn,
      stakeMerkleProofVec,
      stakeMerkleLeaf
    )
    .accounts({
      signer: wallet.publicKey,
      splVoteAccount: splVoteAccount,
      splStakeAccount: stakeAccountPubkey,
      proposal: proposalPubkey,
      consensusResult: consensusResultPda,
      metaMerkleProof: metaMerkleProofPda,
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
    })
    .instruction();

  const transaction = new Transaction();
  transaction.add(castVoteOverrideInstruction);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await program.provider.connection.getLatestBlockhash("confirmed")
  ).blockhash;

  const tx = await wallet.signTransaction(transaction);

  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize(),
    { preflightCommitment: "confirmed" }
  );
  console.log("signature cast vote override", signature);
  return {
    signature,
    success: true,
  };
}
