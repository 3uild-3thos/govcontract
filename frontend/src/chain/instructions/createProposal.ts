/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  BlockchainParams,
  CreateProposalParams,
  GOV_V1_PROGRAM_ID,
  TransactionResult,
} from "./types";
import {
  createProgramWithWallet,
  deriveConsensusResultPda,
  deriveMetaMerkleProofPda,
  getVoterSummary,
  createGovV1ProgramWithWallet,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
} from "./helpers";
import { deriveProposalAccount } from "../helpers";

/**
 * Creates a new governance proposal
 */
export async function createProposal(
  params: CreateProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> {
  const {
    title,
    description,
    // startEpoch,
    // votingLengthEpochs,
    seed,
    wallet,
    voteAccount,
  } = params;
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const voterSummary = await getVoterSummary(
    wallet.publicKey.toString(),
    blockchainParams.network || "mainnet"
  );
  const slot = voterSummary.snapshot_slot;

  // Generate random seed if not provided
  const seedValue = new BN(
    seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
  );

  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

    const voteAccounts = await program.provider.connection.getVoteAccounts();
    const validatorVoteAccount = voteAccounts.current.find(
      (acc) => acc.nodePubkey === wallet.publicKey.toBase58()
    );
    
    if (!validatorVoteAccount) {
      throw new Error(
        `No SPL vote account found for validator identity ${wallet.publicKey.toBase58()}`
      );
    }
    
    const splVoteAccount = new PublicKey(validatorVoteAccount.votePubkey);


  // Derive proposal PDA using the test pattern
  const proposalPda = deriveProposalAccount(program, seedValue, splVoteAccount);

  // Create dummy snapshot accounts for testing (matching test pattern)
  const SNAPSHOT_PROGRAM_ID = GOV_V1_PROGRAM_ID;
  const snapshotSlot = new BN(slot);

  const consensusResult = deriveConsensusResultPda(
    snapshotSlot,
    SNAPSHOT_PROGRAM_ID
  );
  const metaMerkleProof = deriveMetaMerkleProofPda(
    consensusResult,
    wallet.publicKey,
    SNAPSHOT_PROGRAM_ID
  );

  const merkleAccountInfo = program.provider.connection.getAccountInfo(
    metaMerkleProof,
    "confirmed"
  );

  const instructions: TransactionInstruction[] = [];
console.log("merkleAccountInfo", merkleAccountInfo)
  if (merkleAccountInfo === null) {
console.log("merkleAccountInfo is null")
    const govV1Program = createGovV1ProgramWithWallet(
      wallet,
      blockchainParams.endpoint
    );

    const voteAccountProof = await getVoteAccountProof(
      voteAccount?.toBase58() ?? "",
      blockchainParams.network,
      slot
    );
    console.log("fetched voteAccountProof", voteAccountProof);

    const [consensusResultPda, metaMerkleProofPda] =
      generatePdasFromVoteProofResponse(voteAccountProof);

    const a = await govV1Program.methods
      .initMetaMerkleProof(
        {
          activeStake: voteAccountProof.meta_merkle_leaf.active_stake,
          votingWallet: voteAccountProof.meta_merkle_leaf.voting_wallet,
          stakeMerkleRoot: voteAccountProof.meta_merkle_leaf.stake_merkle_root,
          voteAccount: voteAccountProof.meta_merkle_leaf.vote_account,
        } as any,
        voteAccountProof.meta_merkle_proof as any,
        new BN(1)
      )
      .accountsStrict({
        consensusResult: consensusResultPda,
        merkleProof: metaMerkleProofPda,
        payer: wallet.publicKey,
        systemProgram: SNAPSHOT_PROGRAM_ID,
      })
      .instruction();

    instructions.push(a);
  }

  // Build and send transaction using accountsPartial like in tests
  const proposalInstruction = await program.methods
    .createProposal(
      seedValue,
      title,
      description
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
    .instruction();

  instructions.push(proposalInstruction);

  const transaction = new Transaction();
  transaction.add(...instructions);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await program.provider.connection.getLatestBlockhash("confirmed")
  ).blockhash;

  const tx = await wallet.signTransaction(transaction);

  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize()
  );

  return {
    signature,
    success: true,
  };
}

