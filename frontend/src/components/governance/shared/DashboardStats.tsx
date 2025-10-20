import {
  formatLamportsDisplay,
  formatOptionalCount,
  formatOptionalSlot,
} from "@/lib/governance/formatters";
import type { ViewType } from "@/types/governance";

interface DashboardStatsProps {
  network: string;
  snapshotSlot: number;
  currentView: ViewType;
  delegationsReceived?: number; // in lamports
  totalStaked?: number; // in lamports
  activeValidators?: number;
  voteAccountsCount?: number;
}

export function DashboardStats({
  network,
  snapshotSlot,
  currentView,
  delegationsReceived = 0,
  totalStaked = 0,
  activeValidators = 0,
  voteAccountsCount = 0,
}: DashboardStatsProps) {
  type StatEntry = {
    label: string;
    value: string | number;
    mobileValue?: string | number;
    rawValue?: string;
    showRaw: boolean;
  };
  // on mobile only show "custom" when the network is a custom URL, otherwise show the network name
  const isCustomNetwork =
    network &&
    (network.startsWith("http://") || network.startsWith("https://"));
  const networkDisplay = network || "-";
  const networkMobileDisplay = isCustomNetwork ? "Custom" : networkDisplay;

  const stats: StatEntry[] =
    currentView === "validator"
      ? [
          {
            label: "Network",
            value: networkDisplay,
            mobileValue: networkMobileDisplay,
            showRaw: false,
          },
          {
            label: "Snapshot Slot",
            value: formatOptionalSlot(snapshotSlot),
            showRaw: false,
          },
          {
            label: "Delegations Received",
            ...formatLamportsDisplay(delegationsReceived),
          },
          {
            label: "Vote Accounts",
            value: formatOptionalCount(voteAccountsCount),
            showRaw: false,
          },
        ]
      : [
          {
            label: "Network",
            value: networkDisplay,
            mobileValue: networkMobileDisplay,
            showRaw: false,
          },
          {
            label: "Snapshot Slot",
            value: formatOptionalSlot(snapshotSlot),
            showRaw: false,
          },
          {
            label: "Total Staked",
            ...formatLamportsDisplay(totalStaked),
          },
          {
            label: "Active Validators",
            value: formatOptionalCount(activeValidators),
            showRaw: false,
          },
        ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="min-w-0">
          <p className="text-[var(--color-dao-color-gray)] text-[10px] sm:text-xs uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <div>
            <p className="text-foreground text-base sm:text-lg lg:text-xl font-medium">
              <span className="sm:hidden">
                {stat.mobileValue ?? stat.value}
              </span>
              <span className="hidden sm:inline">{stat.value}</span>
            </p>
            {stat.showRaw && stat.rawValue && (
              <p
                className="text-white/50 text-[10px] mt-0.5 truncate"
                title={stat.rawValue}
              >
                {stat.rawValue}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
