import type { ProposalStats } from '@/dummy-data/wallets'

interface SummaryStatsProps {
  stats: ProposalStats
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        Summary Stats
      </h3>

      <div className="grid grid-cols-3 gap-4 flex-1 items-end">
        <div className="bg-white/2 border border-white/10 rounded-lg p-4 flex flex-col">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Proposals
          </p>
          <p className="text-xl font-semibold text-foreground mt-auto">
            {stats.total} 
          </p>
        </div>

        <div className="bg-white/2 border border-white/10 rounded-lg p-4 flex flex-col">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Active
          </p>
          <p className="text-xl font-semibold text-foreground mt-auto">
            {stats.active}
          </p>
        </div>

        <div className="bg-white/2 border border-white/10 rounded-lg p-4 flex flex-col">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            History
          </p>
          <p className="text-xl font-semibold text-foreground mt-auto">
            {stats.history}
          </p>
        </div>
      </div>
    </div>
  )
}