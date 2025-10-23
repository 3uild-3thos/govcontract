import { Fragment } from "react";
import type { ProposalRecord } from "@/types";
import { PHASES } from "./constants";
import { PhaseNode } from "./PhaseNode";
import { ConnectorLine } from "./ConnectorLine";
import { PhaseDetail } from "./PhaseDetail";
import {
  resolvePhaseState,
  resolveConnectorVariant,
  shouldAnimateConnector,
} from "./utils";

interface PhaseTimelineProps {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}

export default function PhaseTimeline({
  proposal,
  isLoading,
}: PhaseTimelineProps) {
  // TODO: PEDRO check proper loading skeletongs
  if (isLoading) return <div>Loading</div>;
  if (!proposal) return <div>No proposal data...</div>;

  const currentPhase = proposal.status;

  const currentPhaseIndex = PHASES.findIndex(
    (phase) => phase.key === currentPhase
  );

  return (
    <div className="glass-card space-y-6 p-6">
      <h4 className="h4 font-semibold">Phase Timeline</h4>

      <div className="relative flex w-full justify-center px-2 sm:px-4 md:px-6 lg:px-8 pb-8">
        <div className="flex w-fit max-w-4xl items-center justify-center gap-0 mx-auto">
          {PHASES.map((phase, index) => {
            const phaseState = resolvePhaseState(
              currentPhase,
              index,
              currentPhaseIndex
            );
            const nextState = resolvePhaseState(
              currentPhase,
              index + 1,
              currentPhaseIndex
            );

            const isLastPhase = index === PHASES.length - 1;
            const connectorVariant = !isLastPhase
              ? resolveConnectorVariant(phaseState, nextState, currentPhase)
              : null;

            const animateConnector =
              connectorVariant !== null
                ? shouldAnimateConnector(connectorVariant, index, currentPhase)
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

      <PhaseDetail currentPhase={currentPhase} />
    </div>
  );
}
