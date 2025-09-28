import { headers } from "next/headers";
import { proposalStats } from "@/dummy-data/proposal-stats";
import { parseDeviceTypeFromUA } from "@/lib/device-detection";
import ProposalsHeader from "@/components/proposals/ProposalsHeader";
import ProposalsView from "@/components/proposals/ProposalsView";

export default async function ProposalsPage() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const deviceType = parseDeviceTypeFromUA(userAgent);

  return (
    <main className="py-8 space-y-10">
      <ProposalsHeader title="Proposal Overview" stats={proposalStats} />
      <ProposalsView title="Recent Proposals" initialDevice={deviceType} />
    </main>
  );
}
