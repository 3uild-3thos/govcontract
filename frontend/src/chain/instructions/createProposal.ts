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
  SNAPSHOT_PROGRAM_ID,
  TransactionResult,
} from "./types";
import {
  createProgramWithWallet,
  getVoterSummary,
  createGovV1ProgramWithWallet,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
  deriveProposalIndexPda,
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
  const proposalPda = deriveProposalAccount(program, seedValue, splVoteAccount);

  const govV1Program = createGovV1ProgramWithWallet(
    wallet,
    blockchainParams.endpoint
  );

  const voteAccountProof = await getVoteAccountProof(
    validatorVoteAccount.votePubkey,
    blockchainParams.network,
    slot
  );
  console.log("fetched voteAccountProof", voteAccountProof);

  const [consensusResultPda, metaMerkleProofPda] =
    generatePdasFromVoteProofResponse(voteAccountProof, SNAPSHOT_PROGRAM_ID, 4);
  const merkleAccountInfo = await program.provider.connection.getAccountInfo(
    metaMerkleProofPda,
    "confirmed"
  );

  const instructions: TransactionInstruction[] = [];
  if (!merkleAccountInfo) {
    console.log("merkleAccountInfo is null");

    console.log("consensusResultPda", consensusResultPda.toBase58());
    console.log("metaMerkleProofPda", metaMerkleProofPda.toBase58());
    const a = await govV1Program.methods
      .initMetaMerkleProof(
        {
          votingWallet: new PublicKey(
            voteAccountProof.meta_merkle_leaf.voting_wallet
          ),
          voteAccount: new PublicKey(
            voteAccountProof.meta_merkle_leaf.vote_account
          ),
          stakeMerkleRoot: Array.from(
            new PublicKey(
              voteAccountProof.meta_merkle_leaf.stake_merkle_root
            ).toBytes()
          ),
          activeStake: new BN(voteAccountProof.meta_merkle_leaf.active_stake),
        },
        voteAccountProof.meta_merkle_proof.map((proof) =>
          Array.from(new PublicKey(proof).toBytes())
        ),
        new BN(1)
      )
      .accountsStrict({
        consensusResult: consensusResultPda,
        merkleProof: metaMerkleProofPda,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    instructions.push(a);
  }

  // Build and send transaction using accountsPartial like in tests
  const proposalInstruction = await program.methods
    .createProposal(seedValue, title, description)
    .accountsStrict({
      signer: wallet.publicKey,
      proposal: proposalPda,
      splVoteAccount,
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
      consensusResult: consensusResultPda,
      metaMerkleProof: metaMerkleProofPda,
      systemProgram: SystemProgram.programId,
      proposalIndex: deriveProposalIndexPda(program.programId),
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
