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
}

export function ConnectorLine({
  variant,
  animate,
  isLoading,
}: ConnectorLineProps) {
  return (
    <span
      className={cn(
        "connector-line mx-3 sm:mx-4 md:mx-6 h-[1.5px] min-w-[4rem] sm:min-w-[5rem] md:min-w-[10rem] flex-1 self-center scale-x-75 sm:scale-x-85 md:scale-x-90 lg:scale-x-100",
        CONNECTOR_OPACITY[variant],
        animate && "connector-line--animated",
        animate && CONNECTOR_CLASSES[variant],
        { "animate-pulse": isLoading }
      )}
      style={CONNECTOR_MASK_STYLE}
    />
  );
}
