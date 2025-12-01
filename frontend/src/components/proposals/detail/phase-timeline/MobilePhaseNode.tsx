"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_STATE_STYLES, NODE_GLOW_STYLES } from "./constants";
import type { VisibleNode, PhaseState } from "./types";
import { PhaseIcon } from "./PhaseIcon";

interface MobilePhaseNodeProps {
  node: VisibleNode;
  isProposalFinalized: boolean;
}

export function MobilePhaseNode({
  node,
  isProposalFinalized,
}: MobilePhaseNodeProps) {
  const { position, type, state, phase } = node;

  const isCreatedNode = type === "created";
  const isCenterPosition = position === "center";
  const isFinalizedPhase = phase?.key === "finalized";

  // Determine visual emphasis based on state and position
  const emphasis = getNodeEmphasis({
    state,
    isCenterPosition,
    isFinalizedPhase,
    isProposalFinalized,
  });

  return (
    <div
      className={cn(
        "flex flex-col items-center relative transition-all duration-300",
        emphasis.containerClass
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-transform duration-300",
          emphasis.isScaled && "scale-105"
        )}
      >
        <NodeGlowRing state={state} isFinalizedPhase={isFinalizedPhase} />

        <span
          className={cn(
            "relative z-10 flex shrink-0 items-center justify-center rounded-full text-sm transition-all duration-300",
            emphasis.sizeClass,
            getNodeColorStyles(state, isFinalizedPhase)
          )}
        >
          {isCreatedNode ? (
            <Check
              className={cn(
                "transition-all",
                emphasis.isScaled ? "size-5 sm:size-6" : "size-4 sm:size-5"
              )}
              strokeWidth={3}
            />
          ) : (
            phase && <PhaseIcon icon={phase.icon} state={state} />
          )}
        </span>
      </div>

      <NodeLabel
        label={getNodeLabel(isCreatedNode, state, phase?.label)}
        isHighlighted={emphasis.isHighlighted}
      />
    </div>
  );
}

interface NodeEmphasisConfig {
  state: PhaseState;
  isCenterPosition: boolean;
  isFinalizedPhase: boolean;
  isProposalFinalized: boolean;
}

interface NodeEmphasis {
  isScaled: boolean;
  isHighlighted: boolean;
  sizeClass: string;
  containerClass: string;
}

/**
 * Determines visual emphasis for a mobile timeline node.
 *
 * Rules:
 * - Center nodes are scaled up (emphasized) unless they're finalized or failed
 * - Passed nodes during finalized proposal are de-emphasized
 * - Failed and finalized-current nodes are highlighted but not scaled
 */
function getNodeEmphasis({
  state,
  isCenterPosition,
  isFinalizedPhase,
  isProposalFinalized,
}: NodeEmphasisConfig): NodeEmphasis {
  const isCurrent = state === "current";
  const isFailed = state === "failed";
  const isPassed = state === "passed";

  const isCurrentFinalizedPhase = isCurrent && isFinalizedPhase;
  const isPassedDuringFinalized = isPassed && isProposalFinalized;

  // Scale center node, except for finalized phase, passed during finalized, or failed
  const isScaled =
    isCenterPosition &&
    !isCurrentFinalizedPhase &&
    !isPassedDuringFinalized &&
    !isFailed;

  // Highlighted = full opacity (scaled, finalized, or failed nodes)
  const isHighlighted = isScaled || isCurrentFinalizedPhase || isFailed;

  // De-emphasized nodes get reduced opacity and scale
  const isDeemphasized =
    !isScaled &&
    !isCurrentFinalizedPhase &&
    !isPassedDuringFinalized &&
    !isFailed;

  const containerClass = cn(
    isDeemphasized && "opacity-60 scale-90",
    isPassedDuringFinalized && "opacity-60 scale-90"
  );

  const sizeClass =
    isFailed || !isScaled ? "size-8 sm:size-10" : "size-10 sm:size-12";

  return { isScaled, isHighlighted, sizeClass, containerClass };
}

interface NodeGlowRingProps {
  state: PhaseState;
  isFinalizedPhase: boolean;
}

function NodeGlowRing({ state, isFinalizedPhase }: NodeGlowRingProps) {
  const isCurrent = state === "current";
  const isFailed = state === "failed";

  // Current non-finalized: animated ping with blur glow
  if (isCurrent && !isFinalizedPhase) {
    return (
      <>
        <span
          className="absolute inset-[-12px] rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 blur-md"
          aria-hidden="true"
        />
        <span className={NODE_GLOW_STYLES.currentPing} aria-hidden="true" />
      </>
    );
  }

  // Current finalized: static glow
  if (isCurrent && isFinalizedPhase) {
    return (
      <span
        className="absolute inset-[-10px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-40"
        aria-hidden="true"
      />
    );
  }

  // Failed: red glow
  if (isFailed) {
    return (
      <span
        className="absolute inset-[-10px] rounded-full bg-destructive/40"
        aria-hidden="true"
      />
    );
  }

  return null;
}

function getNodeColorStyles(
  state: PhaseState,
  isFinalizedPhase: boolean
): string {
  const shadowClass = "shadow-lg";

  switch (state) {
    case "passed":
      return NODE_STATE_STYLES.passed;
    case "current":
      return isFinalizedPhase
        ? `${NODE_STATE_STYLES.current} ${shadowClass} shadow-primary/30`
        : `${NODE_STATE_STYLES.currentAnimated} ${shadowClass} shadow-primary/30`;
    case "upcoming":
      return NODE_STATE_STYLES.upcoming;
    case "failed":
      return `${NODE_STATE_STYLES.failed} ${shadowClass} shadow-destructive/30`;
    default:
      return "";
  }
}

function getNodeLabel(
  isCreatedNode: boolean,
  state: PhaseState,
  phaseLabel?: string
): string {
  if (isCreatedNode) return "Created";
  if (state === "failed") return "Support Failed";
  return phaseLabel ?? "";
}

interface NodeLabelProps {
  label: string;
  isHighlighted: boolean;
}

function NodeLabel({ label, isHighlighted }: NodeLabelProps) {
  return (
    <span
      className={cn(
        "absolute top-full mt-4 text-xs transition-all duration-300 text-center whitespace-nowrap",
        isHighlighted ? "text-white" : "text-white/50"
      )}
    >
      {label}
    </span>
  );
}
