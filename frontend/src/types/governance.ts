import type { WalletData } from "@/dummy-data/wallets";

export enum WalletRole {
  VALIDATOR = "validator",
  STAKER = "staker",
  BOTH = "both",
  NONE = "none",
}

export interface GovernanceDashboardState {
  walletData: WalletData;
  walletRole: WalletRole;
  selectedView: "validator" | "staker";
  network: "mainnet" | "testnet" | "devnet";
}

export type ViewType = "all" | "validator" | "staker";

export interface RoleSwitchProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  walletRole: WalletRole;
}
