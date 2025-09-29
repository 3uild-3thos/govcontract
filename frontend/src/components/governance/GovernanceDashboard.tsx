"use client";

import { useState } from "react";
import { useWalletRole } from "@/hooks/useWalletRole";
import { DashboardStats } from "./shared/DashboardStats";
import { RoleToggle } from "./shared/RoleToggle";
import { ValidatorActionPanel } from "./validator/validator-action-panel";
import { StakerActionPanel } from "./staker/StakerActionPanel";
import { GovernanceEmptyState } from "./shared/GovernanceEmptyState";
import { dummyWallets } from "@/dummy-data/wallets";
import { WalletRole } from "@/lib/governance/role-detection";

export function GovernanceDashboard() {
  // ******** ********** ********
  //  CHANGE THIS TO THE ACTUAL WALLET DATA WITH DIFFERENT SCENARIOS
  //  validatorOnly, stakerOnly, both, noRole
  // ******** ********** ********
  const [walletData] = useState(() => dummyWallets.both);
  const { walletRole, selectedView, setSelectedView, canSwitchView } =
    useWalletRole(walletData);

  // Hardcoded network for now
  const NETWORK = "testnet" as const;

  // Calculate total stats from wallet data
  const calculateStats = () => {
    // Calculate total delegations received (sum of all vote account stakes)
    const delegationsReceived = walletData.vote_accounts.reduce(
      (sum, account) => sum + account.active_stake,
      0,
    );

    // Calculate total staked (sum of all stake account stakes)
    const totalStaked = walletData.stake_accounts.reduce(
      (sum, account) => sum + account.active_stake,
      0,
    );

    return {
      delegationsReceived, // Keep in lamports
      totalStaked, // Keep in lamports
    };
  };

  const stats = calculateStats();

  // Header section with dynamic content based on role
  const renderHeader = () => {
    const roleText = selectedView === "validator" ? "Validator" : "Staker";

    return (
      <div className="glass-card px-8 py-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className=" h2 text-foreground mb-2">Governance Dashboard</h2>
            {walletRole !== WalletRole.NONE && (
              <p className="text-[var(--color-dao-color-gray)] text-sm">
                You are viewing as a{" "}
                <span className="font-semibold gradient-text-primary-secondary">
                  {roleText}
                </span>
              </p>
            )}
          </div>
          {walletRole !== WalletRole.NONE && selectedView && (
            <RoleToggle
              currentView={selectedView}
              onViewChange={setSelectedView}
              canToggle={canSwitchView}
            />
          )}
        </div>

        {walletRole !== WalletRole.NONE && selectedView && (
          <DashboardStats
            network={NETWORK}
            snapshotSlot={walletData.snapshot_slot}
            currentView={selectedView}
            delegationsReceived={stats.delegationsReceived}
            totalStaked={stats.totalStaked}
            activeValidators={walletData.stake_accounts.length}
            voteAccountsCount={walletData.vote_accounts.length}
          />
        )}
      </div>
    );
  };

  const renderDashboardContent = () => {
    // Show validator view if:
    // - User is validator only
    // - User has both roles and selected validator view
    if (
      walletRole === WalletRole.VALIDATOR ||
      (walletRole === WalletRole.BOTH && selectedView === "validator")
    ) {
      return <ValidatorActionPanel voteAccounts={walletData.vote_accounts} />;
    }

    // Show staker view if:
    // - User is staker only
    // - User has both roles and selected staker view
    if (
      walletRole === WalletRole.STAKER ||
      (walletRole === WalletRole.BOTH && selectedView === "staker")
    ) {
      return (
        <StakerActionPanel
          proposalStats={walletData.proposalStats}
          stakeAccounts={walletData.stake_accounts}
        />
      );
    }

    return null;
  };

  // If no role, only show empty state
  if (walletRole === WalletRole.NONE) {
    return (
      <div className="space-y-6">
        <GovernanceEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderDashboardContent()}
    </div>
  );
}
