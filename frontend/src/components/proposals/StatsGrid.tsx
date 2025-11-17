"use client";

import StatsCard from "@/components/proposals/StatsCard";
import { useProposalOverviewStats } from "@/hooks";

export default function ProposalsStatsGrid() {
  const { stats, isLoading } = useProposalOverviewStats();

  return (
    <div className="grid gap-4 grid-cols-1 text-center lg:grid-cols-3">
      {stats.map((stat) => (
        <StatsCard key={stat.id} {...stat} isLoading={isLoading} />
      ))}
    </div>
  );
}
