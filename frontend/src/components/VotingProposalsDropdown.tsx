import { useProposals } from "@/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";
import { formatAddress } from "@/lib/governance/formatters";
import { Loader2 } from "lucide-react";

interface VotingProposalsDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const VotingProposalsDropdown = ({
  value,
  onValueChange,
  disabled,
}: VotingProposalsDropdownProps) => {
  const { data: proposals, isLoading } = useProposals({
    voting: true,
    finalized: false,
  });

  return (
    <div className="space-y-2">
      <label
        htmlFor="proposal-id"
        className="text-sm font-medium text-white/80"
      >
        Proposal ID
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isLoading || disabled}
      >
        <SelectTrigger className="text-white w-full">
          <div className="flex gap-1 items-center">
            <span className="text-dao-text-secondary">Proposal:</span>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-white/60" />
            ) : (
              <SelectValue placeholder="-" />
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="text-white bg-background/40 backdrop-blur">
          {proposals?.map((proposal) => (
            <SelectItem
              key={proposal.publicKey.toBase58()}
              value={proposal.publicKey.toBase58()}
            >
              {proposal.title} -&nbsp;{" "}
              {formatAddress(proposal.publicKey.toBase58())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
