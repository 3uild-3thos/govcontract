interface VoteItemProps {
  label: string;
  amount: string;
  percentage: string;
  color: string;
}

export default function VoteItem({
  label,
  amount,
  percentage,
  color,
}: VoteItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3">
        <span className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${color}`} />
        <p className="text-xs md:text-xs lg:text-sm font-medium text-foreground">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1.5 md:gap-2 lg:gap-2 text-right">
        <p className="text-xs md:text-xs lg:text-sm font-semibold text-foreground/30">
          {amount}
        </p>
        <p className="text-xs md:text-xs lg:text-sm font-semibold text-foreground/30">
          {percentage}
        </p>
      </div>
    </div>
  );
}

interface VoteItemSkeletonProps {
  color: string;
  label: string;
}

export function VoteItemSkeleton({ color, label }: VoteItemSkeletonProps) {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3">
        <span className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${color}`} />
        <p className="text-xs md:text-xs lg:text-sm font-medium text-foreground">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1.5 md:gap-2 lg:gap-2 text-right">
        <div className="h-4 w-16 bg-white/10 rounded" />
        <div className="h-4 w-10 bg-white/10 rounded" />
      </div>
    </div>
  );
}
