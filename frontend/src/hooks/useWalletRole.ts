import { useState, useEffect } from "react";
import { WalletRole, type ViewType } from "@/types";
import {
  determineWalletRole,
  getDefaultView,
} from "@/lib/governance/role-detection";
import { useStakeAccounts } from "./useStakeAccounts";
import { useDelegatedStakeAccounts } from "./useDelegatedStakeAccounts";

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

  const { data: stakeAccounts, isLoading: isLoadingStake } =
    useStakeAccounts(userPubKey);
  const { data: delegatedStakeAccounts, isLoading: isLoadingDelegated } =
    useDelegatedStakeAccounts(userPubKey);

  const isLoading = isLoadingStake || isLoadingDelegated;

  useEffect(() => {
    if (isLoading) return;

    const role = determineWalletRole(stakeAccounts, delegatedStakeAccounts);

    setWalletRole(role);
    setSelectedView((prev) => prev ?? getDefaultView(role));
  }, [isLoading, stakeAccounts, delegatedStakeAccounts]);

  return { walletRole, selectedView, setSelectedView, isLoading };
}
