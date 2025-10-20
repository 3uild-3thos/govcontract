import { formatNumber } from "@/helpers";

type StatsCardProps = {
  label: string;
  value: number;
};

export default function StatsCard({ label, value }: StatsCardProps) {
  return (
    <article className="glass-card px-2 py-4 sm:p-6 flex h-full flex-col justify-between gap-4">
      <div className="proposal-stats-card-content">
        <div className="proposal-stats-card-wrapper">
          <p className="proposal-stats-card-label">{label}</p>
          <span className="proposal-stats-card-value">
            {formatNumber(value)}
          </span>
        </div>
      </div>
    </article>
  );
}
