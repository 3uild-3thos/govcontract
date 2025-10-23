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

    if (activeRef.current) {
      const { offsetLeft, offsetWidth, offsetHeight } = activeRef.current;
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        height: `${offsetHeight}px`,
      });
    }
  }, [currentView]);

  if (!canToggle) {
    return null;
  }

  return (
    <div className="role-toggle">
      <div className="role-toggle-indicator" style={indicatorStyle} />

      {/* Buttons */}
      <button
        ref={validatorRef}
        onClick={() => onViewChange("validator")}
        className={`role-toggle-button ${
          currentView === "validator"
            ? "role-toggle-button-active"
            : "role-toggle-button-inactive"
        }`}
      >
        Validator
      </button>
      <button
        ref={stakerRef}
        onClick={() => onViewChange("staker")}
        className={`role-toggle-button ${
          currentView === "staker"
            ? "role-toggle-button-active"
            : "role-toggle-button-inactive"
        }`}
      >
        Staker
      </button>
    </div>
  );
}
