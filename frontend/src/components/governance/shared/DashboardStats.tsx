import { useEndpoint } from "@/contexts/EndpointContext";
import {
  formatLamportsDisplay,
  formatOptionalCount,
  formatOptionalSlot,
} from "@/lib/governance/formatters";
import type { ViewType } from "@/types/governance";

interface DashboardStatsProps {
  currentView: ViewType;
  isLoading: boolean;
}

type StatEntry = {
  label: string;
  value: string | number;
  mobileValue?: string | number;
  rawValue?: string;
  showRaw: boolean;
  isLoading: boolean;
};

export function DashboardStats({
  currentView,
  isLoading,
}: DashboardStatsProps) {
  const { endpointType } = useEndpoint();

  const snapshotSlot = 245789456;
  const delegationsReceived = 123;
  const voteAccountsCount = 321;

  const totalStaked = 0;
  const activeValidators = 0;

  // TODO: on mobile only show "custom" when the network is a custom URL, otherwise show the network name

  const stats: StatEntry[] =
    currentView === "validator"
      ? [
          {
            label: "Network",
            value: endpointType,
            mobileValue: endpointType,
            showRaw: false,
            isLoading,
          },
          {
            label: "Snapshot Slot",
            value: formatOptionalSlot(snapshotSlot),
            showRaw: false,
            isLoading,
          },
          {
            label: "Delegations Received",
            ...formatLamportsDisplay(delegationsReceived),
            isLoading,
          },
          {
            label: "Vote Accounts",
            value: formatOptionalCount(voteAccountsCount),
            showRaw: false,
            isLoading,
          },
        ]
      : [
          {
            label: "Network",
            value: endpointType,
            mobileValue: endpointType,
            showRaw: false,
            isLoading,
          },
          {
            label: "Snapshot Slot",
            value: formatOptionalSlot(snapshotSlot),
            showRaw: false,
            isLoading,
          },
          {
            label: "Total Staked",
            ...formatLamportsDisplay(totalStaked),
            isLoading,
          },
          {
            label: "Active Validators",
            value: formatOptionalCount(activeValidators),
            showRaw: false,
            isLoading,
          },
        ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="min-w-0">
          <p className="text-(--color-dao-color-gray) text-[10px] sm:text-xs uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          {stat.isLoading ? (
            <div className="h-6 w-20 bg-white/10 animate-pulse rounded-full mt-2" />
          ) : (
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
          )}
        </div>
      ))}
    </div>
  );
}
