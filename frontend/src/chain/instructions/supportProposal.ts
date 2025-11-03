import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  BlockchainParams,
  SupportProposalParams,
  SNAPSHOT_PROGRAM_ID,
  TransactionResult,
} from "./types";
import {
  createProgramWithWallet,
  deriveSupportPda,
  getVoterSummary,
  createGovV1ProgramWithWallet,
  getVoteAccountProof,
  generatePdasFromVoteProofResponse,
} from "./helpers";

/**
 * Supports a governance proposal
 */
export async function supportProposal(
  params: SupportProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> {
  const { proposalId, wallet } = params;

  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const voterSummary = await getVoterSummary(
    wallet.publicKey.toString(),
    blockchainParams.network || "mainnet"
  );
  const program = createProgramWithWallet(wallet, blockchainParams.endpoint);

  const voteAccounts = await program.provider.connection.getVoteAccounts();
  const validatorVoteAccount = voteAccounts.current.find(
    (acc) => acc.nodePubkey === wallet.publicKey.toBase58()
  );
  const slot = voterSummary.snapshot_slot;

  const proposalPubkey = new PublicKey(proposalId);

  if (!validatorVoteAccount) {
    throw new Error(
      `No SPL vote account found for validator identity ${wallet.publicKey.toBase58()}`
    );
  }
  // Derive support PDA - based on IDL, it uses proposal and signer
  const supportPda = deriveSupportPda(
    proposalPubkey,
    new PublicKey(validatorVoteAccount.votePubkey),
    program.programId
  );

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

    const initMerkleInstruction = await govV1Program.methods
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

    instructions.push(initMerkleInstruction);
  }

  // Build support proposal instruction
  const supportProposalInstruction = await program.methods
    .supportProposal()
    .accountsStrict({
      signer: wallet.publicKey,
      proposal: proposalPubkey,
      support: supportPda,
      splVoteAccount: new PublicKey(validatorVoteAccount.votePubkey),
      snapshotProgram: SNAPSHOT_PROGRAM_ID,
      consensusResult: consensusResultPda,
      metaMerkleProof: metaMerkleProofPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  instructions.push(supportProposalInstruction);

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

  console.log("signature support proposal", signature);

  return {
    signature,
    success: true,
  };
}
