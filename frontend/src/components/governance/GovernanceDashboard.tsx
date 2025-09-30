"use client";

import { GovernanceEmptyState } from "./shared/GovernanceEmptyState";
import { useGovernanceDashboard } from "@/hooks/useGovernanceDashboard";
import { GovernanceDashboardLayout } from "@/components/governance/GovernanceDashboardLayout";

export function GovernanceDashboard() {
  const {
    walletRole,
    selectedView,
    setSelectedView,
    canSwitchView,
    walletData,
    stats,
    network,
    isEmptyState,
  } = useGovernanceDashboard();

  // If no role, only show empty state
  if (isEmptyState) {
    return (
      <div className="space-y-6">
        <GovernanceEmptyState />
      </div>
    );
  }

  return (
    <GovernanceDashboardLayout
      walletRole={walletRole}
      selectedView={selectedView}
      setSelectedView={setSelectedView}
      canSwitchView={canSwitchView}
      walletData={walletData}
      stats={stats}
      network={network}
    />
  );
}
