import { useState, useEffect } from "react";
import { WalletRole, type ViewType } from "@/types";
import {
  determineWalletRole,
  getDefaultView,
} from "@/lib/governance/role-detection";
import { useVoterWalletSummary } from "./useVoterWalletSummary";

interface UseWalletRoleReturn {
  walletRole: WalletRole;
  selectedView: ViewType | undefined;
  setSelectedView: (view: ViewType | undefined) => void;
  isLoading: boolean;
}

export function useWalletRole(
  userPubKey: string | undefined
): UseWalletRoleReturn {
  const [walletRole, setWalletRole] = useState<WalletRole>(WalletRole.STAKER);
  const [selectedView, setSelectedView] = useState<ViewType | undefined>(
    "staker"
  );

  const { data, isLoading } = useVoterWalletSummary(userPubKey);

  useEffect(() => {
    if (isLoading || data === undefined) return;

    const role = determineWalletRole(data.stake_accounts, data.vote_accounts);

    setWalletRole(role);
    setSelectedView(getDefaultView(role));
  }, [isLoading, data]);

  return { walletRole, selectedView, setSelectedView, isLoading };
}
