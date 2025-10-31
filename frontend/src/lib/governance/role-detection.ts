import { ViewType } from "@/types";

export enum WalletRole {
  VALIDATOR = "validator",
  STAKER = "staker",
  BOTH = "both",
  NONE = "none",
}

export function determineWalletRole(
  stakeAccounts: unknown[] | undefined,
  delegatedStakeAccounts: unknown[] | undefined
): WalletRole {
  const hasStake = !!stakeAccounts?.length;
  const hasDelegated = !!delegatedStakeAccounts?.length;

  if (hasStake && hasDelegated) return WalletRole.BOTH;
  else if (hasStake) return WalletRole.STAKER;
  else if (hasDelegated) return WalletRole.VALIDATOR;

  // default to staker even if there are no stake accounts
  return WalletRole.STAKER;
}

export function getDefaultView(role: WalletRole): ViewType | undefined {
  switch (role) {
    case WalletRole.VALIDATOR:
      return "validator";
    case WalletRole.STAKER:
      return "staker";
    case WalletRole.BOTH:
      return "validator";
    default:
      return undefined;
  }
}
