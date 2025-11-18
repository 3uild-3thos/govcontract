import type { PhaseState, ConnectorVariant, PhaseKey } from "./types";

export function resolvePhaseState(
  currentPhase: PhaseKey,
  phaseIndex: number,
  currentPhaseIndex: number
): PhaseState {
  if (currentPhase === "supporting") {
    return "upcoming";
  }

  if (currentPhaseIndex === -1) {
    return phaseIndex === 0 ? "active" : "upcoming";
  }

  if (phaseIndex < currentPhaseIndex) {
    return "passed";
  }

  if (phaseIndex === currentPhaseIndex) {
    return "active";
  }

  return "upcoming";
}

export function resolveConnectorVariant(
  leftState: PhaseState,
  rightState: PhaseState,
  currentPhase: PhaseKey
): ConnectorVariant {
  if (leftState === "passed" && rightState === "passed") {
    return "complete";
  }

  if (rightState === "active") {
    return "active";
  }

  if (leftState === "active") {
    return currentPhase === "voting" ? "upcoming" : "active";
  }

  return "upcoming";
}

export function shouldAnimateConnector(
  variant: ConnectorVariant,
  phaseIndex: number,
  currentPhase: PhaseKey
): boolean {
  if (variant === "upcoming") {
    return false;
  }

  if (currentPhase === "voting") {
    return phaseIndex === 0;
  }

  if (currentPhase === "finalized") {
    return true;
  }

  return false;
}
