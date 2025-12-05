import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function RequirementItem({
  met,
  text,
  isLoading,
}: {
  met: boolean;
  text: string;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm",
          isLoading
            ? "bg-white/5 border border-white/10"
            : met
            ? "bg-green-500/20 border border-green-500/30"
            : "bg-white/5 border border-white/10"
        )}
      >
        {isLoading ? (
          <div className="h-2 w-2 animate-pulse rounded bg-white/20" />
        ) : (
          met && <Check className="h-2 w-2 text-green-400" />
        )}
      </div>
      <span
        className={cn(
          "text-xs sm:text-sm",
          isLoading ? "text-white/60" : met ? "text-white/80" : "text-white/40"
        )}
      >
        {text}
      </span>
    </div>
  );
}
