"use client";

import { Fragment } from "react";
import { PHASES } from "./constants";
import {
  resolvePhaseState,
  resolveConnectorVariant,
  shouldAnimateConnector,
} from "./utils";
import type { PhaseKey } from "./types";
import { CreatedNode } from "./CreatedNode";
import { ConnectorLine } from "./ConnectorLine";
import { ProposalRecord } from "@/types";
import { PhaseNode } from "./PhaseNode";

interface DesktopPhaseTimelineProps {
  proposal: ProposalRecord;
  currentPhase: PhaseKey;
}

export function DesktopPhaseTimeline({
  proposal,
  currentPhase,
}: DesktopPhaseTimelineProps) {
  const currentPhaseIndex = PHASES.findIndex(
    (phase) => phase.key === currentPhase
  );
  const isFinalized = proposal.status === "finalized";
  const isFailed = proposal.status === "failed";

  return (
    <div className="relative flex w-full justify-center px-2 sm:px-4 md:px-6 lg:px-8 pb-10">
      <div className="flex w-fit max-w-4xl items-center justify-center gap-0 mx-auto">
        <CreatedNode />
        <ConnectorLine
          variant="complete"
          animate={currentPhaseIndex >= 0 && !isFinalized && !isFailed}
        />
        {PHASES.map((phase, index) => {
          const phaseState = resolvePhaseState(
            index,
            currentPhaseIndex,
            proposal.status
          );
          const nextState = resolvePhaseState(
            index + 1,
            currentPhaseIndex,
            proposal.status
          );

          const isLastPhase = index === PHASES.length - 1;
          const connectorVariant = !isLastPhase
            ? resolveConnectorVariant(phaseState, nextState)
            : null;

          const animateConnector =
            connectorVariant !== null && !isFailed
              ? shouldAnimateConnector(
                  connectorVariant,
                  index,
                  currentPhase,
                  isFinalized,
                  currentPhaseIndex
                )
              : false;

          return (
            <Fragment key={phase.key}>
              <PhaseNode phase={phase} state={phaseState} />

              {connectorVariant && (
                <ConnectorLine
                  variant={connectorVariant}
                  animate={animateConnector}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
