/**
 * Example usage of governance contract instructions
 * These examples show how to integrate with wallet adapters and handle results
 */

import {
  createProposal,
  castVote,
  modifyVote,
  castVoteOverride,
  supportProposal,
  addMerkleRoot,
  finalizeProposal,
  TransactionResult,
} from "./index";
import { AnchorWallet } from "@solana/wallet-adapter-react";

/**
 * Example: Create a new proposal
 */
export async function exampleCreateProposal(
  wallet: AnchorWallet
): Promise<string | null> {
  console.log("Creating new proposal...");

  const result = await createProposal({
    title: "Increase Validator Commission Cap",
    description:
      "Proposal to increase the maximum validator commission from 10% to 15%. See: https://github.com/solana-labs/solana/issues/12345",
    startEpoch: 550, // Start voting in epoch 550
    votingLengthEpochs: 5, // Vote for 5 epochs
    wallet,
    // seed: 123456789, // Optional: specify seed for reproducible PDA
    // voteAccount: new PublicKey("..."), // Optional: specify vote account
  });

  if (result.success) {
    console.log("✅ Proposal created successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );

    // You would typically derive the proposal PDA to get the proposal ID
    // For this example, we'll return a placeholder
    return "proposal_public_key_here";
  } else {
    console.error("❌ Failed to create proposal:", result.error);
    return null;
  }
}

/**
 * Example: Cast a vote on a proposal
 */
export async function exampleCastVote(
  wallet: AnchorWallet,
  proposalId: string
): Promise<void> {
  console.log("Casting vote on proposal...");

  const result = await castVote({
    proposalId,
    forVotesBp: 7500, // 75% in favor
    againstVotesBp: 2500, // 25% against
    abstainVotesBp: 0, // 0% abstain
    wallet,
  });

  if (result.success) {
    console.log("✅ Vote cast successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );
  } else {
    console.error("❌ Failed to cast vote:", result.error);
  }
}

/**
 * Example: Modify an existing vote
 */
export async function exampleModifyVote(
  wallet: AnchorWallet,
  proposalId: string
): Promise<void> {
  console.log("Modifying existing vote...");

  const result = await modifyVote({
    proposalId,
    forVotesBp: 5000, // Change to 50% in favor
    againstVotesBp: 3000, // 30% against
    abstainVotesBp: 2000, // 20% abstain
    wallet,
  });

  if (result.success) {
    console.log("✅ Vote modified successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );
  } else {
    console.error("❌ Failed to modify vote:", result.error);
  }
}

/**
 * Example: Cast a vote override using stake account
 */
export async function exampleCastVoteOverride(
  wallet: AnchorWallet,
  proposalId: string,
  stakeAccount: string
): Promise<void> {
  console.log("Casting vote override...");

  const result = await castVoteOverride({
    proposalId,
    forVotesBp: 10000, // 100% in favor
    againstVotesBp: 0, // 0% against
    abstainVotesBp: 0, // 0% abstain
    stakeAccount,
    wallet,
  });

  if (result.success) {
    console.log("✅ Vote override cast successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );
  } else {
    console.error("❌ Failed to cast vote override:", result.error);
  }
}

/**
 * Example: Support a proposal
 */
export async function exampleSupportProposal(
  wallet: AnchorWallet,
  proposalId: string
): Promise<void> {
  console.log("Supporting proposal...");

  const result = await supportProposal({
    proposalId,
    wallet,
  });

  if (result.success) {
    console.log("✅ Proposal supported successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );
  } else {
    console.error("❌ Failed to support proposal:", result.error);
  }
}

/**
 * Example: Add merkle root to proposal
 */
export async function exampleAddMerkleRoot(
  wallet: AnchorWallet,
  proposalId: string,
  merkleRoot: string
): Promise<void> {
  console.log("Adding merkle root to proposal...");

  const result = await addMerkleRoot({
    proposalId,
    merkleRootHash: merkleRoot, // e.g., "0x1234567890abcdef..."
    wallet,
  });

  if (result.success) {
    console.log("✅ Merkle root added successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );
  } else {
    console.error("❌ Failed to add merkle root:", result.error);
  }
}

/**
 * Example: Finalize a proposal
 */
export async function exampleFinalizeProposal(
  wallet: AnchorWallet,
  proposalId: string
): Promise<void> {
  console.log("Finalizing proposal...");

  const result = await finalizeProposal({
    proposalId,
    wallet,
  });

  if (result.success) {
    console.log("✅ Proposal finalized successfully!");
    console.log(
      "Transaction:",
      `https://explorer.solana.com/tx/${result.signature}`
    );
  } else {
    console.error("❌ Failed to finalize proposal:", result.error);
  }
}

/**
 * Example: Complete proposal workflow
 */
export async function exampleCompleteWorkflow(
  wallet: AnchorWallet
): Promise<void> {
  console.log("🚀 Starting complete proposal workflow...");

  try {
    // 2. Create a proposal
    const proposalId = await exampleCreateProposal(wallet);
    if (!proposalId) {
      throw new Error("Failed to create proposal");
    }

    // 3. Support the proposal
    await exampleSupportProposal(wallet, proposalId);

    // 4. Cast a vote
    await exampleCastVote(wallet, proposalId);

    // 5. Modify the vote
    await exampleModifyVote(wallet, proposalId);

    // 6. Add merkle root (optional)
    await exampleAddMerkleRoot(
      wallet,
      proposalId,
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    );

    // 7. Finalize proposal (after voting period ends)
    await exampleFinalizeProposal(wallet, proposalId);

    console.log("🎉 Complete workflow finished successfully!");
  } catch (error) {
    console.error("💥 Workflow failed:", error);
  }
}

/**
 * Example: Error handling and retry logic
 */
export async function exampleWithRetry(
  operation: () => Promise<TransactionResult>,
  maxRetries: number = 3
): Promise<TransactionResult> {
  let lastError: string | undefined;

  for (let i = 0; i < maxRetries; i++) {
    console.log(`Attempt ${i + 1}/${maxRetries}...`);

    const result = await operation();

    if (result.success) {
      return result;
    }

    lastError = result.error;
    console.warn(`Attempt ${i + 1} failed:`, result.error);

    // Wait before retrying (exponential backoff)
    if (i < maxRetries - 1) {
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, ...
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    signature: "",
    success: false,
    error: `All ${maxRetries} attempts failed. Last error: ${lastError}`,
  };
}

/**
 * Example usage with retry:
 *
 * const result = await exampleWithRetry(
 *   () => castVote({
 *     proposalId: "...",
 *     forVotesBp: 5000,
 *     againstVotesBp: 5000,
 *     abstainVotesBp: 0,
 *     wallet,
 *   })
 * );
 */
