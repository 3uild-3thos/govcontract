"use client";

import { formatAddress } from "@/lib/governance/formatters";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

interface CopyableAddressProps {
  address: string;
  shortenedLength?: number;
  copyLabel?: string;
  className?: string;
}

export function CopyableAddress({
  address,
  shortenedLength = 4,
  copyLabel = "Copy",
  className,
}: CopyableAddressProps) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const shortened = formatAddress(address, shortenedLength);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="font-mono text-white/90">{shortened}</div>
      <button
        type="button"
        onClick={() => copyToClipboard(address)}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 hover:cursor-pointer"
      >
        {copied ? "Copied!" : copyLabel}
      </button>
    </div>
  );
}
