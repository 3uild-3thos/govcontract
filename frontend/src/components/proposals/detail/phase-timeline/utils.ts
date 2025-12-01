import { ProposalStatus } from "@/types";
import type {
  PhaseState,
  ConnectorVariant,
  PhaseKey,
  PhaseDefinition,
  VisibleNode,
} from "./types";

export function resolvePhaseState(
  phaseIndex: number,
  currentPhaseIndex: number,
  proposalStatus?: ProposalStatus
): PhaseState {
  if (proposalStatus === "failed") {
    if (phaseIndex === 0) {
      return "failed";
    }
    return "upcoming";
  }

  if (currentPhaseIndex === -1) {
    return phaseIndex === 0 ? "current" : "upcoming";
  }

  if (phaseIndex < currentPhaseIndex) {
    return "passed";
  }

  if (phaseIndex === currentPhaseIndex) {
    return "current";
  }

  return "upcoming";
}

export function resolveConnectorVariant(
  leftState: PhaseState,
  rightState: PhaseState
): ConnectorVariant {
  if (leftState === "passed" && rightState === "passed") {
    return "complete";
  }

  if (leftState === "passed" && rightState === "current") {
    return "complete";
  }

  if (rightState === "current") {
    return "flowing";
  }

  if (leftState === "current" && rightState === "upcoming") {
    return "upcoming";
  }

  if (leftState === "current") {
    return "flowing";
  }

  return "upcoming";
}

export function shouldAnimateConnector(
  variant: ConnectorVariant,
  phaseIndex: number,
  currentPhase: PhaseKey,
  isFinalized: boolean,
  currentPhaseIndex: number
): boolean {
  if (variant === "upcoming") {
    return false;
  }

  if (currentPhase === "finalized") {
    return !isFinalized;
  }

  return phaseIndex < currentPhaseIndex;
}

interface MobileVisibleNodesConfig {
  phases: PhaseDefinition[];
  currentPhaseIndex: number;
  proposalStatus: ProposalStatus;
}

/**
 * Calculates which 3 nodes to display in the mobile timeline carousel.
 *
 * Mobile shows a sliding window of 3 nodes: [previous, current, next]
 * Special cases:
 * - First phase: shows [Created, current, next]
 * - Last phase (finalized): shows [prev-2, prev-1, current] (current on right, not center)
 * - Failed: shows [Created, failed-phase, next-phase]
 */
export function calculateMobileVisibleNodes({
  phases,
  currentPhaseIndex,
  proposalStatus,
}: MobileVisibleNodesConfig): VisibleNode[] {
  const lastPhaseIndex = phases.length - 1;
  const isFinalized = proposalStatus === "finalized";
  const isFailed = proposalStatus === "failed";

  // Finalized at last phase: show last 3 phases with current on right (not centered)
  if (isFinalized && currentPhaseIndex === lastPhaseIndex) {
    return [
      createPhaseNode(phases[lastPhaseIndex - 2], "passed", "left"),
      createPhaseNode(phases[lastPhaseIndex - 1], "passed", "center"),
      createPhaseNode(phases[lastPhaseIndex], "current", "right"),
    ];
  }

  // Failed: proposal fails at first phase (support), show Created + failed + next
  if (isFailed) {
    return [
      createCreatedNode("left"),
      createPhaseNode(phases[0], "failed", "center"),
      createPhaseNode(phases[1], "upcoming", "right"),
    ];
  }

  // Normal flow: sliding window [previous, current, next]
  const nodes: VisibleNode[] = [];

  // Left: previous phase or Created
  if (currentPhaseIndex === 0) {
    nodes.push(createCreatedNode("left"));
  } else {
    const prevState = resolvePhaseState(
      currentPhaseIndex - 1,
      currentPhaseIndex,
      proposalStatus
    );
    nodes.push(
      createPhaseNode(phases[currentPhaseIndex - 1], prevState, "left")
    );
  }

  // Center: current phase
  const currentState = resolvePhaseState(
    currentPhaseIndex,
    currentPhaseIndex,
    proposalStatus
  );
  nodes.push(
    createPhaseNode(phases[currentPhaseIndex], currentState, "center")
  );

  // Right: next phase (if exists)
  if (currentPhaseIndex < lastPhaseIndex) {
    const nextState = resolvePhaseState(
      currentPhaseIndex + 1,
      currentPhaseIndex,
      proposalStatus
    );
    nodes.push(
      createPhaseNode(phases[currentPhaseIndex + 1], nextState, "right")
    );
  }

  return nodes;
}

function createPhaseNode(
  phase: PhaseDefinition,
  state: PhaseState,
  position: VisibleNode["position"]
): VisibleNode {
  return { type: "phase", phase, state, position };
}

function createCreatedNode(position: VisibleNode["position"]): VisibleNode {
  return { type: "created", state: "passed", position };
}

/**
 * Determines if edge connectors should extend beyond visible nodes.
 *
 * Left connector: indicates phases exist before the visible window
 * Right connector: indicates phases exist after the visible window
 */
export function shouldShowEdgeConnectors(
  phases: PhaseDefinition[],
  currentPhaseIndex: number,
  isFailed: boolean,
  isFinalized: boolean,
  visibleNodesCount: number
): { left: boolean; right: boolean } {
  const lastPhaseIndex = phases.length - 1;

  // Left: show when visible window doesn't start at beginning
  // For failed: Created is shown, so nothing before it
  // For normal: show if currentPhaseIndex > 0 (meaning Created node is hidden)
  const showLeft = currentPhaseIndex > 0 && !isFailed;

  // Right: show when visible window doesn't reach the end
  // Calculate what phase index the rightmost visible node represents
  let rightmostPhaseIndex: number;
  if (isFinalized && currentPhaseIndex === lastPhaseIndex) {
    rightmostPhaseIndex = lastPhaseIndex;
  } else if (isFailed) {
    rightmostPhaseIndex = 1;
  } else {
    rightmostPhaseIndex = Math.min(currentPhaseIndex + 1, lastPhaseIndex);
  }

  const showRight =
    visibleNodesCount === 3 && rightmostPhaseIndex < lastPhaseIndex;

  return { left: showLeft, right: showRight };
}
