import { useSummaryStats } from "@/hooks";

interface Props {
  isLoading?: boolean;
}

export function SummaryStats({ isLoading }: Props) {
  const { data: stats, isLoading: isStatsLoading } = useSummaryStats();
  
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        Summary Stats
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 flex-1 items-end">
        <div className="bg-white/2 border border-white/10 rounded-lg p-4 flex flex-col">
          <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1">
            Total
          </p>
          {isLoading || isStatsLoading ? (
            <div className="bg-white/10 animate-pulse rounded-lg h-6 w-7 mt-1" />
          ) : (
            <p className="text-base sm:text-xl font-semibold text-foreground mt-auto text-center sm:text-left">
              {stats.total}
            </p>
          )}
        </div>

        <div className="bg-white/2 border border-white/10 rounded-lg p-4 flex flex-col">
          <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1">
            Active
          </p>
          {isLoading || isStatsLoading ? (
            <div className="bg-white/10 animate-pulse rounded-lg h-6 w-7 mt-1" />
          ) : (
            <p className="text-base sm:text-xl font-semibold text-foreground mt-auto text-center sm:text-left">
              {stats.active}
            </p>
          )}
        </div>

        <div className="bg-white/2 border border-white/10 rounded-lg p-4 flex flex-col">
          <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1">
            Finalized
          </p>
          {isLoading || isStatsLoading ? (
            <div className="bg-white/10 animate-pulse rounded-lg h-6 w-7 mt-1" />
          ) : (
            <p className="text-base sm:text-xl font-semibold text-foreground mt-auto text-center sm:text-left">
              {stats.finalized}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
