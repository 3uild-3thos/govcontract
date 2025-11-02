import { AppButton } from "@/components/ui/AppButton";

interface GovernanceEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
}

export function GovernanceEmptyState({
  title = "No Wallet Connected",
  description = "Connect your wallet to view your governance dashboard and participate in voting.",
  actionLabel = "Connect Wallet",
  onAction,
}: GovernanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="glass-card p-8 text-center max-w-md">
        <h3 className="h3 mb-4 font-semibold">{title}</h3>
        <p className="text-[var(--color-dao-color-gray)] mb-6 text-sm sm:text-base">
          {description}
        </p>
        <AppButton
          text={actionLabel}
          variant="gradient"
          className="rounded-full font-semibold"
          onClick={onAction}
        />
      </div>
    </div>
  );
}
