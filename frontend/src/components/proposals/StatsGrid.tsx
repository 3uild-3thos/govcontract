"use client";

import StatsCard from "@/components/proposals/StatsCard";
import { useProposalOverviewStats } from "@/hooks";

export default function ProposalsStatsGrid() {
  const { stats, isLoading } = useProposalOverviewStats();

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.id} {...stat} isLoading={isLoading} />
      ))}
    </div>
  );
}
