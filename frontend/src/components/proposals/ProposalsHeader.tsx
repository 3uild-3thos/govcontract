import ProposalsStatsGrid from "@/components/proposals/StatsGrid";

type ProposalsHeaderProps = {
  title: string;
  subtitle?: string;
  stats: {
    id: string;
    label: string;
    value: number;
  }[];
};

export default function ProposalsHeader({
  title,
  subtitle,
  stats,
}: ProposalsHeaderProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="h2 text-foreground">{title}</h2>
        {subtitle ? <p className="p text-muted">{subtitle}</p> : null}
      </header>
      <ProposalsStatsGrid stats={stats} />
    </section>
  );
}
