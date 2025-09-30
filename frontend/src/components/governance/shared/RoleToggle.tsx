"use client";

import { useState, useRef, useEffect } from "react";

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
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const validatorRef = useRef<HTMLButtonElement>(null);
  const stakerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const activeRef = currentView === "validator" ? validatorRef : stakerRef;
    if (activeRef.current && canToggle) {
      setIndicatorStyle({
        transform: `translateX(${activeRef.current.offsetLeft}px)`,
        width: `${activeRef.current.offsetWidth}px`,
      });
    }
  }, [currentView, canToggle]);

  // If can't toggle, show only one button in the same style
  if (!canToggle) {
    return (
      <div className="inline-flex items-center rounded-full bg-black/20 p-0.5 sm:p-0.5">
        <div className="px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm sm:text-xs bg-gradient-to-r from-secondary to-gray-500/30 text-white font-semibold">
          {currentView === "validator" ? "Validator" : "Staker"}
        </div>
      </div>
    );
  }

  // If can toggle, show both options with smooth sliding indicator
  return (
    <div className="relative inline-flex items-center rounded-full p-0.5 sm:p-0.5 bg-black/20">
      {/* Sliding indicator */}
      <div
        className="absolute h-[calc(100%-4px)] rounded-full bg-gradient-to-r from-secondary to-gray-500/30 transition-all duration-300 ease-in-out"
        style={indicatorStyle}
      />

      {/* Buttons */}
      <button
        ref={validatorRef}
        onClick={() => onViewChange("validator")}
        className={`relative z-10 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm sm:text-xs font-medium transition-colors duration-300 ${
          currentView === "validator"
            ? "text-white font-semibold"
            : "text-muted hover:text-white/90"
        }`}
      >
        Validator
      </button>
      <button
        ref={stakerRef}
        onClick={() => onViewChange("staker")}
        className={`relative z-10 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm sm:text-xs font-medium transition-colors duration-300 ${
          currentView === "staker"
            ? "text-white font-semibold"
            : "text-muted hover:text-white/90"
        }`}
      >
        Staker
      </button>
    </div>
  );
}
