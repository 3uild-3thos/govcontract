export const LAMPORTS_PER_SOL = 1e9;

const isValidNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && !Number.isNaN(value);

export type LamportsDisplay = {
  value: string;
  rawValue?: string;
  showRaw: boolean;
};

export function formatSOL(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;

  // Only use compact notation for amounts >= 10M
  if (sol >= 1e9) {
    return `${(sol / 1e9).toFixed(2)}B`;
  } else if (sol >= 1e7) {
    return `${(sol / 1e6).toFixed(2)}M`;
  }

  // For amounts less than 10M, use regular formatting
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sol);
}

export function formatPercentage(percentage: number) {
  return `(${percentage.toFixed(0)}%)`;
}

export function formatAddress(address: string, length: number = 4): string {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatCommission(commission: number | undefined): string {
  if (commission === undefined) return "N/A";
  return `${commission}%`;
}

export function formatOptionalSlot(
  slot: number | null | undefined
): string | number {
  return isValidNumber(slot) ? slot : "-";
}

export function formatOptionalCount(
  count: number | null | undefined
): string | number {
  return isValidNumber(count) ? count : "-";
}

export function formatLamportsDisplay(
  lamports: number | null | undefined
): LamportsDisplay {
  if (!isValidNumber(lamports)) {
    return {
      value: "-",
      showRaw: false,
    };
  }

  const sol = lamports / LAMPORTS_PER_SOL;
  const compact = formatSOL(lamports);
  const value = compact.includes("SOL") ? compact : `${compact} SOL`;

  const rawValue = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sol);

  const showRaw = sol >= 10_000_000;

  return {
    value,
    rawValue: showRaw ? `${rawValue} SOL` : undefined,
    showRaw,
  };
}
