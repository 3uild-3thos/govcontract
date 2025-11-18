import { ChainVoteAccountData } from "@/chain";
import { ViewType } from "@/types";

export enum WalletRole {
  VALIDATOR = "validator",
  STAKER = "staker",
  BOTH = "both",
  NONE = "none",
}

export function determineWalletRole(
  stakeAccounts: unknown[] | undefined,
  voteAccounts: unknown[] | undefined,
  chainVoteAccount: ChainVoteAccountData | undefined
): WalletRole {
  const hasStake = !!stakeAccounts?.length;
  const hasVoteAccounts = !!voteAccounts?.length && !!chainVoteAccount;

  if (hasStake && hasVoteAccounts) return WalletRole.BOTH;
  else if (hasStake) return WalletRole.STAKER;
  else if (hasVoteAccounts) return WalletRole.VALIDATOR;

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
