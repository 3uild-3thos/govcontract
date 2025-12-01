import { cn } from "@/lib/utils";
import {
  CONNECTOR_OPACITY,
  CONNECTOR_CLASSES,
  CONNECTOR_MASK_STYLE,
} from "./constants";
import type { ConnectorVariant } from "./types";

interface ConnectorLineProps {
  variant: ConnectorVariant;
  animate: boolean;
  isLoading?: boolean;
  edge?: boolean;
}

export function ConnectorLine({
  variant,
  animate,
  isLoading,
  edge = false,
}: ConnectorLineProps) {
  return (
    <span
      className={cn(
        "connector-line h-[1.5px] flex-1 self-center",
        edge
          ? "min-w-0 w-full"
          : "mx-3 sm:mx-4 md:mx-5 lg:mx-4 xl:mx-5 min-w-[4rem] sm:min-w-[5rem] md:min-w-[9rem] lg:min-w-[8.5rem] xl:min-w-[9rem] sm:scale-x-85 md:scale-x-90 lg:scale-x-100",
        CONNECTOR_OPACITY[variant],
        CONNECTOR_CLASSES[variant],
        animate && "connector-line--animated",
        { "animate-pulse": isLoading }
      )}
      style={CONNECTOR_MASK_STYLE}
    />
  );
}
