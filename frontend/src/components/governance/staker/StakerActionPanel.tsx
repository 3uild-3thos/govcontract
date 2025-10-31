import { GovernanceActions } from "@/components/governance/shared/GovernanceActions";
import { SummaryStats } from "@/components/governance/staker/SummaryStats";
import { StakeAccountsTable } from "@/components/governance/staker/StakeAccountsTable";

interface StakerActionPanelProps {
  userPubKey: string;
  isLoading: boolean;
}

export function StakerActionPanel({
  userPubKey,
  isLoading,
}: StakerActionPanelProps) {
  return (
    <div className="space-y-8 lg:space-y-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GovernanceActions variant="staker" isLoading={isLoading} />
        <SummaryStats isLoading={isLoading} />
      </div>
      <StakeAccountsTable userPubKey={userPubKey} isLoading={isLoading} />
    </div>
  );
}
