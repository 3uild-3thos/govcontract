import { ProposalStatus } from "@/types";

export type PhaseKey = ProposalStatus;
export type PhaseState = "passed" | "current" | "upcoming" | "failed";
export type PhaseIconKey = "voting" | "clock" | "flame" | "discussion";
export type ConnectorVariant = "complete" | "flowing" | "upcoming";
export type NodePosition = "left" | "center" | "right";

export interface PhaseDefinition {
  key: PhaseKey;
  label: string;
  icon: PhaseIconKey;
}

export interface PhaseDetail {
  title: string;
  body: string;
}

export interface VisibleNode {
  type: "created" | "phase";
  phase?: PhaseDefinition;
  state: PhaseState;
  position: NodePosition;
}
