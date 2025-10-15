import type { ProposalStats } from "@/dummy-data/wallets";
import { GovernanceActions } from "@/components/governance/shared/GovernanceActions";
import { SummaryStats } from "@/components/governance/staker/SummaryStats";
import { StakeAccountsTable } from "@/components/governance/staker/StakeAccountsTable";

interface StakerActionPanelProps {
  proposalStats: ProposalStats;
}

export function StakerActionPanel({ proposalStats }: StakerActionPanelProps) {
  return (
    <div className="space-y-8 lg:space-y-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GovernanceActions variant="staker" />
        <SummaryStats stats={proposalStats} />
      </div>
      <StakeAccountsTable />
    </div>
  );
}
