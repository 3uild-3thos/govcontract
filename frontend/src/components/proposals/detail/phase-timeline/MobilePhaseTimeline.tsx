"use client";

import { Fragment, useMemo } from "react";
import { PHASES } from "./constants";
import {
  calculateMobileVisibleNodes,
  resolveConnectorVariant,
  shouldAnimateConnector,
  shouldShowEdgeConnectors,
} from "./utils";
import type { PhaseKey, PhaseState } from "./types";
import { ProposalRecord } from "@/types";
import { ConnectorLine } from "./ConnectorLine";
import { MobilePhaseNode } from "./MobilePhaseNode";

interface MobilePhaseTimelineProps {
  proposal: ProposalRecord;
  currentPhase: PhaseKey;
}

export function MobilePhaseTimeline({
  proposal,
  currentPhase,
}: MobilePhaseTimelineProps) {
  const currentPhaseIndex = PHASES.findIndex(
    (phase) => phase.key === currentPhase
  );
  const isFinalized = proposal.status === "finalized";
  const isFailed = proposal.status === "failed";

  const visibleNodes = useMemo(
    () =>
      calculateMobileVisibleNodes({
        phases: PHASES,
        currentPhaseIndex,
        proposalStatus: proposal.status,
      }),
    [currentPhaseIndex, proposal.status]
  );

  const edgeConnectors = useMemo(
    () =>
      shouldShowEdgeConnectors(
        PHASES,
        currentPhaseIndex,
        isFailed,
        isFinalized,
        visibleNodes.length
      ),
    [currentPhaseIndex, isFailed, isFinalized, visibleNodes.length]
  );

  return (
    <div className="relative w-full pb-12">
      <div className="relative flex items-center gap-0">
        <EdgeConnector
          show={edgeConnectors.left}
          variant="complete"
          animate={!isFinalized && !isFailed}
          position="left"
        />

        <div className="flex items-center gap-0 flex-shrink-0">
          {visibleNodes.map((node, index) => {
            const isLast = index === visibleNodes.length - 1;
            const nextNode = visibleNodes[index + 1];

            const nodePhaseIndex =
              node.type === "created"
                ? -1
                : PHASES.findIndex((p) => p.key === node.phase?.key);

            const nodeState: PhaseState = node.state;
            const nextState: PhaseState | undefined = nextNode?.state;

            const connectorVariant =
              !isLast && nextState
                ? resolveConnectorVariant(nodeState, nextState)
                : null;

            const animateConnector =
              connectorVariant && !isFailed
                ? shouldAnimateConnector(
                    connectorVariant,
                    nodePhaseIndex,
                    currentPhase,
                    isFinalized,
                    currentPhaseIndex
                  )
                : false;

            return (
              <Fragment
                key={node.type === "created" ? "created" : node.phase?.key}
              >
                <MobilePhaseNode
                  node={node}
                  isProposalFinalized={isFinalized}
                />
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

        <EdgeConnector
          show={edgeConnectors.right}
          variant="upcoming"
          animate={false}
          position="right"
        />
      </div>
    </div>
  );
}

interface EdgeConnectorProps {
  show: boolean;
  variant: "complete" | "upcoming";
  animate: boolean;
  position: "left" | "right";
}

function EdgeConnector({
  show,
  variant,
  animate,
  position,
}: EdgeConnectorProps) {
  const justifyClass = position === "left" ? "justify-end" : "";

  return (
    <div className={`flex-1 flex items-center ${justifyClass} min-w-0`}>
      {show && (
        <ConnectorLine variant={variant} animate={animate} edge={true} />
      )}
    </div>
  );
}
