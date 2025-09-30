import { GovernanceActions } from "@/components/governance/shared/GovernanceActions";
import { VoteAccountsTable } from "@/components/governance/validator/VoteAccountsTable";
import type { VoteAccountData } from "@/dummy-data/wallets";

interface ValidatorActionPanelProps {
  voteAccounts: VoteAccountData[];
}

export function ValidatorActionPanel({
  voteAccounts,
}: ValidatorActionPanelProps) {
  return (
    <div className="space-y-8 lg:space-y-12">
      <GovernanceActions variant="validator" />
      <VoteAccountsTable data={voteAccounts} />
    </div>
  );
}
