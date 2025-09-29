import type { WalletData } from "@/dummy-data/wallets";

export enum WalletRole {
  VALIDATOR = "validator",
  STAKER = "staker",
  BOTH = "both",
  NONE = "none",
}

export function determineWalletRole(walletData: WalletData): WalletRole {
  const hasVoteAccounts =
    walletData.vote_accounts && walletData.vote_accounts.length > 0;
  const hasStakeAccounts =
    walletData.stake_accounts && walletData.stake_accounts.length > 0;

  if (hasVoteAccounts && hasStakeAccounts) {
    return WalletRole.BOTH;
  }

  if (hasVoteAccounts) {
    return WalletRole.VALIDATOR;
  }

  if (hasStakeAccounts) {
    return WalletRole.STAKER;
  }

  return WalletRole.NONE;
}

export function getDefaultView(
  role: WalletRole,
): "validator" | "staker" | null {
  switch (role) {
    case WalletRole.VALIDATOR:
      return "validator";
    case WalletRole.STAKER:
      return "staker";
    case WalletRole.BOTH:
      return "validator";
    default:
      return null;
  }
}
