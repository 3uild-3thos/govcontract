"use client";

import { useState, useEffect, useRef } from "react";
import { CircleCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationButtonProps {
  isVisible: boolean;
  isThresholdMet: boolean;
  message: string;
}

export function NotificationButton({
  isVisible,
  isThresholdMet,
  message,
}: NotificationButtonProps) {
  const [showMessage, setShowMessage] = useState(false);
  const hasInteracted = useRef(false);

  // Auto-hide after 3 seconds
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  const handleClick = () => {
    hasInteracted.current = true;
    setShowMessage((prev) => !prev);
  };

  if (!isVisible) return null;

  const tooltipClasses = cn(
    "absolute bottom-full z-10 mb-2 w-64 rounded-xl p-3 text-sm shadow-lg",
    "right-0 sm:left-0 sm:right-auto",
    "bg-white/5 backdrop-blur-xl border border-white/10 text-white/80",
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300",
          isThresholdMet
            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
          "animate-in fade-in slide-in-from-right-4 duration-500",
        )}
      >
        {isThresholdMet ? (
          <CircleCheck className="size-4" aria-hidden="true" />
        ) : (
          <Zap className="size-4 animate-pulse" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {isThresholdMet ? "Threshold Met" : "Almost There"}
        </span>
      </button>

      {/* Auto-show on first render, hidden once user interacts */}
      {!hasInteracted.current && (
        <div className={cn(tooltipClasses, "animate-notification-auto-show")}>
          {message}
        </div>
      )}

      {/* Manual toggle */}
      {showMessage && (
        <div
          className={cn(
            tooltipClasses,
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
          )}
        >
          {message}
        </div>
      )}
    </div>
  );
}
