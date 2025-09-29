import { useState, useEffect, useMemo } from "react";
import { WalletRole, type ViewType } from "@/types";
import type { WalletData } from "@/dummy-data/wallets";
import {
  determineWalletRole,
  getDefaultView,
} from "@/lib/governance/role-detection";

interface UseWalletRoleReturn {
  walletData: WalletData;
  walletRole: WalletRole;
  selectedView: ViewType | null;
  setSelectedView: (view: ViewType) => void;
  canSwitchView: boolean;
}

export function useWalletRole(walletData: WalletData): UseWalletRoleReturn {
  const walletRole = useMemo(
    () => determineWalletRole(walletData),
    [walletData],
  );
  const defaultView = useMemo(() => getDefaultView(walletRole), [walletRole]);
  const [selectedView, setSelectedView] = useState<ViewType | null>(
    defaultView,
  );

  useEffect(() => {
    setSelectedView(defaultView);
  }, [defaultView]);

  const canSwitchView = walletRole === WalletRole.BOTH;

  return {
    walletData,
    walletRole,
    selectedView,
    setSelectedView,
    canSwitchView,
  };
}
