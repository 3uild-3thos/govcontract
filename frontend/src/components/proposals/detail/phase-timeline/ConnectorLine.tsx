import { cn } from "@/lib/utils";
import { CONNECTOR_OPACITY, CONNECTOR_CLASSES, CONNECTOR_MASK_STYLE } from "./constants";
import type { ConnectorVariant } from "./types";

interface ConnectorLineProps {
  variant: ConnectorVariant;
  animate: boolean;
}

export function ConnectorLine({ variant, animate }: ConnectorLineProps) {
  return (
    <span
      className={cn(
        "connector-line mx-6 h-[1.5px] min-w-[6rem] flex-1 self-center -translate-y-3 md:min-w-[10rem]",
        CONNECTOR_OPACITY[variant],
        animate && "connector-line--animated",
        animate && CONNECTOR_CLASSES[variant]
      )}
      style={CONNECTOR_MASK_STYLE}
    />
  );
}