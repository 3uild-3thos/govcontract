"use client";

import { useCopyToClipboard } from "@/hooks";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";

interface CopyableAddressProps {
  address: string;
  copyLabel?: string;
  className?: string;
  size?: number;
}

export function CopyableAddressIcon({
  address,
  copyLabel = "Copy",
  className,
  size,
}: CopyableAddressProps) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className={className}>
      {copied ? (
        <CheckIcon
          size={size}
          className={cn("text-green-500", {
            "size-3 lg:size-4": size === undefined,
          })}
        />
      ) : (
        <CopyIcon
          size={size}
          className={cn("text-white/60 hover:cursor-pointer", {
            "size-3 lg:size-4": size === undefined,
          })}
          onClick={() => copyToClipboard(address)}
        />
      )}
      <p className="sr-only">{copyLabel}</p>
    </div>
  );
}
