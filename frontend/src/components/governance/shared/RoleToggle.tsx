import { cn } from "@/lib/utils";

export type ViewType = "validator" | "staker";

interface RoleToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  canToggle: boolean;
}

export function RoleToggle({
  currentView,
  onViewChange,
  canToggle,
}: RoleToggleProps) {
  // If can't toggle, show only one button in the same style
  if (!canToggle) {
    return (
      <div className="flex items-center rounded-full bg-black/20 p-0.5">
        <div className="px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-secondary to-gray-500/30 text-white font-semibold">
          {currentView === "validator" ? "Validator" : "Staker"}
        </div>
      </div>
    );
  }

  // If can toggle, show both options
  return (
    <div className="flex items-center rounded-full p-0.5 bg-black/20">
      <button
        onClick={() => onViewChange("validator")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          currentView === "validator"
            ? "bg-gradient-to-r from-secondary to-gray-500/30 text-white font-semibold"
            : "text-muted hover:text-white/90 cursor-pointer",
        )}
      >
        Validator
      </button>
      <button
        onClick={() => onViewChange("staker")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          currentView === "staker"
            ? "bg-gradient-to-r from-secondary to-gray-500/30 text-foreground font-semibold"
            : "text-muted hover:text-white/90 cursor-pointer",
        )}
      >
        Staker
      </button>
    </div>
  );
}
