import type { ProposalStats, StakeAccountData } from "@/dummy-data/wallets";
import { GovernanceActions } from "../shared/GovernanceActions";
import { SummaryStats } from "./summary-stats";
import { StakeAccountsTable } from "./StakeAccountsTable";

interface StakerActionPanelProps {
  proposalStats: ProposalStats;
  stakeAccounts: StakeAccountData[];
}

export function StakerActionPanel({
  proposalStats,
  stakeAccounts,
}: StakerActionPanelProps) {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <GovernanceActions variant="staker" />
        </div>
        <div>
          <SummaryStats stats={proposalStats} />
        </div>
      </div>
      <StakeAccountsTable data={stakeAccounts} />
    </div>
  );
}
