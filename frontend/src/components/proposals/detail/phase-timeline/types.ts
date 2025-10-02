import type { ProposalLifecycleStage } from "@/dummy-data/proposals";

export type PhaseKey = ProposalLifecycleStage;
export type PhaseState = "passed" | "active" | "upcoming";
export type PhaseIconKey = "check" | "voting" | "clock";
export type ConnectorVariant = "complete" | "active" | "upcoming";

export interface PhaseDefinition {
  key: PhaseKey;
  label: string;
  icon: PhaseIconKey;
}

export interface PhaseDetail {
  title: string;
  body: string;
}