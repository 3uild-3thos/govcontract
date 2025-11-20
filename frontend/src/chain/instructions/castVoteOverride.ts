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
  convertMerkleProofStrings,
  convertStakeMerkleLeafDataToIdlType,
  validateVoteBasisPoints,
  deriveVotePda,
  deriveVoteOverridePda,
  deriveVoteOverrideCachePda,
  getMetaMerkleProofPda,
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
    consensusResult,
  } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  if (slot === undefined) {
    throw new Error("Slot is not defined");
  }

  if (consensusResult === undefined) {
    throw new Error("Consensus result not defined");
  }

  // Validate vote distribution
  validateVoteBasisPoints(forVotesBp, againstVotesBp, abstainVotesBp);

  const proposalPubkey = new PublicKey(proposalId);
  const splVoteAccount = new PublicKey(voteAccount);
  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);
  const snapshotProgram = createGovV1ProgramWithWallet(
    wallet,
    blockchainParams.endpoint
  );

  const stakeAccountPubkey = new PublicKey(stakeAccount);

  const consensusAcc = await snapshotProgram.account.consensusResult.fetch(
    consensusResult
  );
  console.log(
    "consensusAcc:",
    new PublicKey(consensusAcc.ballot.metaMerkleRoot).toBase58(),
    new PublicKey(consensusAcc.ballot.snapshotHash).toBase58()
  );

  // consensusAcc: BJC3zN8wq1GeCBFCLf5rQXo3QLFZbyfLJXWaJvrzMx6Q CfzhKPXFe7YahXVmzpKRyaJqxAsvz214Zo2VFZJMsioj

  // '{"snapshotSlot":"15f1c98a",
  // "ballot":{"metaMerkleRoot":[152,252,61,48,248,172,236,241,130,20,144,239,95,110,138,194,255,246,118,0,71,109,109,64,93,151,250,6,221,77,204,5],
  // "snapshotHash":[173,109,220,238,165,65,12,2,88,69,143,103,211,137,77,187,159,85,207,156,227,119,49,68,41,70,154,21,105,98,175,10]},
  // "tieBreakerConsensus":false}'

  // SendTransactionError: Simulation failed.
  // Message: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1779.
  // Logs:
  // [
  //   "Program DYvhrdFv8PSzta2u2igEoAXR6A6nzUXBnVhy6iNM6F7o invoke [1]",
  //   "Program log: Instruction: InitMetaMerkleProof",
  //   "Program 11111111111111111111111111111111 invoke [2]",
  //   "Program 11111111111111111111111111111111 success",
  //   "Program log: Root BJC3zN8wq1GeCBFCLf5rQXo3QLFZbyfLJXWaJvrzMx6Q != Node 9yFC99swZereuzurg6Wy9VYM1tGC5v5AbvQJMk2WYcji",
  //   "Program log: AnchorError thrown in programs/gov-v1/src/merkle_helper.rs:48. Error Code: InvalidMerkleProof. Error Number: 6009. Error Message: Invalid merkle proof.",
  //   "Program DYvhrdFv8PSzta2u2igEoAXR6A6nzUXBnVhy6iNM6F7o consumed 20113 of 200000 compute units",
  //   "Program DYvhrdFv8PSzta2u2igEoAXR6A6nzUXBnVhy6iNM6F7o failed: custom program error: 0x1779"
  // ].

  // Get proofs
  const network = blockchainParams.network;
  const [metaMerkleProof, stakeMerkleProof] = await Promise.all([
    getVoteAccountProof(splVoteAccount.toBase58(), network, slot),
    getStakeAccountProof(stakeAccount, network, slot),
  ]);

  const metaMerkleProofPda = getMetaMerkleProofPda(
    metaMerkleProof,
    SNAPSHOT_PROGRAM_ID,
    consensusResult
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

    console.log("log:", {
      consensusResult,
      merkleProof: metaMerkleProofPda,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    });

    // '{"consensusResult":"AagyvVs676jmytwMUPtwefhynBhhJ7zir57Mf4vuu2UL",
    // "merkleProof":"EV458DMNTaRjxmAhuPrw1QocjrcWAdmW36ZjkTq2GkU1",
    // "payer":"2qr3GM59WXRi2hPkQ9ATugpqMG6p4YFsuSLYYLSzQfGT","systemProgram":"11111111111111111111111111111111"}'

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
        consensusResult,
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

  // Build cast vote override instruction
  const castVoteOverrideInstruction = await program.methods
    .castVoteOverride(
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
      consensusResult,
      metaMerkleProof: metaMerkleProofPda,
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      voteOverride: voteOverridePda,
      voteOverrideCache: voteOverrideCachePda,
      validatorVote: votePda,
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
