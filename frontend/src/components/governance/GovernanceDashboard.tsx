"use client";

import { GovernanceEmptyState } from "./shared/GovernanceEmptyState";
import { GovernanceDashboardLayout } from "@/components/governance/GovernanceDashboardLayout";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function GovernanceDashboard() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnectWallet = () => {
    setVisible(true);
  };

  // If not connected, only show empty state
  if (!connected || !publicKey) {
    return (
      <div className="space-y-6">
        <GovernanceEmptyState onAction={handleConnectWallet} />
      </div>
    );
  }

  return <GovernanceDashboardLayout userPubKey={publicKey} />;
}
