import { Fragment } from "react";
import type { ProposalRecord } from "@/dummy-data/proposals";
import { PHASES } from "./constants";
import { PhaseNode } from "./PhaseNode";
import { ConnectorLine } from "./ConnectorLine";
import { PhaseDetail } from "./PhaseDetail";
import {
  resolvePhaseState,
  resolveConnectorVariant,
  shouldAnimateConnector,
} from "./utils";
import type { PhaseKey } from "./types";

interface PhaseTimelineProps {
  proposal: ProposalRecord;
  currentPhase: PhaseKey;
}

export default function PhaseTimeline({
  proposal,
  currentPhase,
}: PhaseTimelineProps) {
  const currentPhaseIndex = PHASES.findIndex(
    (phase) => phase.key === currentPhase,
  );
  const isFinalizing = proposal.status === "finalizing";
  const isFinalized = proposal.status === "finalized";

  return (
    <div className="glass-card space-y-6 p-6">
      <h4 className="h4 font-semibold">Phase Timeline</h4>

      <div className="relative flex w-full justify-center px-8">
        <div className="flex w-full max-w-4xl items-center gap-0">
          {PHASES.map((phase, index) => {
            const phaseState = resolvePhaseState(
              currentPhase,
              index,
              currentPhaseIndex,
            );
            const nextState = resolvePhaseState(
              currentPhase,
              index + 1,
              currentPhaseIndex,
            );

            const isLastPhase = index === PHASES.length - 1;
            const connectorVariant = !isLastPhase
              ? resolveConnectorVariant(phaseState, nextState, currentPhase)
              : null;

            const animateConnector =
              connectorVariant !== null
                ? shouldAnimateConnector(
                    connectorVariant,
                    index,
                    currentPhase,
                    isFinalizing,
                    isFinalized,
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

      <PhaseDetail currentPhase={currentPhase} status={proposal.status} />
    </div>
  );
}
