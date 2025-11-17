import { useWalletStakeAccounts } from "@/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";
import {
  formatAddress,
  formatLamportsDisplay,
} from "@/lib/governance/formatters";
import { Loader2 } from "lucide-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

interface VotingProposalsDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  disabledAccounts?: string[];
}

export const StakeAccountsDropdown = ({
  value,
  onValueChange,
  disabled,
  disabledAccounts,
}: VotingProposalsDropdownProps) => {
  const wallet = useAnchorWallet();

  const { data: stakeAccounts, isLoading } = useWalletStakeAccounts(
    wallet?.publicKey?.toBase58()
  );

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={isLoading || disabled}
    >
      <SelectTrigger className="text-white w-full">
        <div className="flex gap-1 items-center">
          <span className="text-dao-text-secondary">Stake account:</span>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-white/60" />
          ) : (
            <SelectValue placeholder="-" />
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="text-white bg-background/40 backdrop-blur">
        {stakeAccounts?.map((stakeAcc) => (
          <SelectItem
            key={stakeAcc.stakeAccount}
            value={stakeAcc.stakeAccount}
            disabled={disabledAccounts?.includes(stakeAcc.stakeAccount)}
          >
            {formatAddress(stakeAcc.stakeAccount)} -&nbsp;
            {formatLamportsDisplay(stakeAcc.activeStake).value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
