import { GovernanceActions } from "@/components/governance/shared/GovernanceActions";
import { VoteAccountsTable } from "@/components/governance/validator/VoteAccountsTable";

export function ValidatorActionPanel() {
  return (
    <div className="space-y-8 lg:space-y-12">
      <GovernanceActions variant="validator" />
      <VoteAccountsTable />
    </div>
  );
}
