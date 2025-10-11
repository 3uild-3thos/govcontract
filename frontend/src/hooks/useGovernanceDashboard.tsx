import { useMemo, useState } from "react";
import { dummyWallets, type WalletData } from "@/dummy-data/wallets";
import { useWalletRole } from "@/hooks";
import { WalletRole } from "@/lib/governance/role-detection";

const NETWORK = "testnet" as const;

export interface UseGovernanceDashboardOptions {
  initialWalletData?: WalletData;
}

export interface GovernanceDashboardStats {
  delegationsReceived: number;
  totalStaked: number;
}

export function useGovernanceDashboard(
  options: UseGovernanceDashboardOptions = {},
) {
  const { initialWalletData } = options;

  /* **************************************************
    CHANGE THIS TO USE THE DIFFERENT WALLET ROLES & NO WALLET DATA
  *************************************************** */
  const [walletData] = useState<WalletData>(
    () => initialWalletData ?? dummyWallets.both,
  );

  const walletRoleState = useWalletRole(walletData);

  const stats = useMemo<GovernanceDashboardStats>(() => {
    const delegationsReceived = walletData.vote_accounts.reduce(
      (sum, account) => sum + account.active_stake,
      0,
    );

    const totalStaked = walletData.stake_accounts.reduce(
      (sum, account) => sum + account.active_stake,
      0,
    );

    return {
      delegationsReceived,
      totalStaked,
    };
  }, [walletData]);

  const isEmptyState = walletRoleState.walletRole === WalletRole.NONE;

  return {
    network: NETWORK,
    stats,
    isEmptyState,
    ...walletRoleState,
  };
}
