import StatsCard from "@/components/proposals/StatsCard";

type Stat = {
  id: string;
  label: string;
  value: number;
};

type StatsGridProps = {
  stats: Stat[];
};

export default function ProposalsStatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.id} {...stat} />
      ))}
    </div>
  );
}
