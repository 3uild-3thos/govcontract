import { SUPPORT_THRESHOLD_PERCENT } from "@/components/proposals/detail/support-phase-progress";
import type { ProposalStatus } from "@/types";
import { PublicKey } from "@solana/web3.js";

export interface GetProposalStatusParams {
  creationEpoch: number;
  currentEpoch: number;
  clusterSupportLamports: number;
  totalStakedLamports: number;
  consensusResult: PublicKey | undefined;
  finalized: boolean;
  voting: boolean;
}

/**
 * Determines proposal status based on epoch-based rules:
 *
 * Example with creationEpoch = 800:
 * - Epoch 800: "supporting" (before support phase)
 * - Epoch 801: "supporting" (support phase active - time between epoch 800 ending and 802 starting)
 * - Epoch 802: Check 10% threshold at start of epoch
 *   - If NOT met: "failed"
 *   - If met: "discussion" (discussion phase starts)
 * - Epochs 802-804: "discussion" (discussion phase - from start of 802 to end of 804/start of 805)
 * - Epoch 805: "discussion" (snapshot phase - shown as discussion, from end of 804 to start of 806)
 * - Epochs 806+: "voting" (if consensusResult exists) or "discussion" (if snapshot not ready)
 *
 * General formula:
 * - Support: epoch (creationEpoch + 1)
 * - Discussion: epochs (creationEpoch + 2) to (creationEpoch + 4)
 * - Snapshot: epoch (creationEpoch + 5)
 * - Voting: epochs (creationEpoch + 6)+
 */
export const getProposalStatus = ({
  creationEpoch,
  currentEpoch,
  clusterSupportLamports,
  totalStakedLamports,
  consensusResult,
  finalized,
  voting,
}: GetProposalStatusParams): ProposalStatus => {
  // If finalized, always return finalized
  if (finalized) {
    return "finalized";
  }

  const supportStartEpoch = creationEpoch + 1; // epoch 801 for creationEpoch 800
  const supportEndEpoch = creationEpoch + 2; // epoch 802 for creationEpoch 800 (threshold check)
  const discussionStartEpoch = creationEpoch + 2; // epoch 802 for creationEpoch 800
  const discussionEndEpoch = creationEpoch + 4; // epoch 804 for creationEpoch 800
  const snapshotEpoch = creationEpoch + 5; // epoch 805 for creationEpoch 800
  const votingStartEpoch = creationEpoch + 6; // epoch 806 for creationEpoch 800

  // Before support phase starts
  if (currentEpoch < supportStartEpoch) {
    return "supporting";
  }

  // During support phase (epoch 801 for creationEpoch 800)
  if (currentEpoch === supportStartEpoch) {
    return "supporting";
  }

  // If we're past the discussion phase, use the voting flag from on-chain data
  // instead of checking thresholds
  if (currentEpoch > discussionEndEpoch) {
    // If voting flag is false, threshold wasn't met
    if (!voting) {
      return "failed";
    }

    // Voting flag is true - check if snapshot is ready
    if (currentEpoch >= votingStartEpoch) {
      if (consensusResult) {
        return "voting";
      }
      // Snapshot not available yet, still in discussion
      return "discussion";
    }

    // Between snapshot epoch and voting start epoch
    if (currentEpoch === snapshotEpoch) {
      return "discussion";
    }
  }

  // At support end epoch (epoch 802) - check if threshold was met
  // This is the only time we check the threshold
  if (currentEpoch === supportEndEpoch) {
    const requiredThresholdLamports =
      totalStakedLamports * (SUPPORT_THRESHOLD_PERCENT / 100);
    const isThresholdMet = clusterSupportLamports >= requiredThresholdLamports;

    if (!isThresholdMet) {
      return "failed";
    }
  }

  // Threshold was met, continue with phase progression
  // During discussion phase (epochs 802-804 for creationEpoch 800)
  if (
    currentEpoch >= discussionStartEpoch &&
    currentEpoch <= discussionEndEpoch
  ) {
    return "discussion";
  }

  // Snapshot phase (epoch 805 for creationEpoch 800) - show as discussion
  if (currentEpoch === snapshotEpoch) {
    return "discussion";
  }

  // Fallback (shouldn't reach here, but return supporting as default)
  return "supporting";
};
