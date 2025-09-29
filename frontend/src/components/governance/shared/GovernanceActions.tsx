import { AppButton } from "@/components/ui/AppButton";
import { ViewType } from "@/types/governance";
import { PencilLine, PlusCircle, ThumbsUp, VoteIcon } from "lucide-react";

interface GovernanceActionsProps {
  variant: ViewType;
}

interface ActionButtonConfig {
  label: string;
  variant: "gradient" | "outline";
  icon?: React.ReactNode;
  onClick: () => void;
  className: string;
}

interface ActionGridProps {
  actions: ActionButtonConfig[];
  gridClassName: string;
}

function logAction(message: string) {
  return () => console.log(message);
}

function ActionGrid({ actions, gridClassName }: ActionGridProps) {
  return (
    <div className={gridClassName}>
      {actions.map((action) => (
        <AppButton
          key={action.label}
          text={action.label}
          variant={action.variant}
          onClick={action.onClick}
          className={action.className}
          icon={action.icon}
          size="lg"
        />
      ))}
    </div>
  );
}

function ValidatorActionsContent() {
  const actions: ActionButtonConfig[] = [
    {
      label: "Create Proposal",
      variant: "gradient",
      onClick: logAction("Create Proposal"),
      className: "w-full font-semibold",
      icon: <PlusCircle className="size-4" />,
    },
    {
      label: "Support Proposal",
      variant: "outline",
      onClick: logAction("Support Proposal"),
      className: "w-full bg-white/3",
      icon: <ThumbsUp className="size-4" />,
    },
    {
      label: "Cast Vote",
      variant: "outline",
      onClick: logAction("Cast Vote"),
      className: "w-full bg-white/3",
      icon: <VoteIcon className="size-4" />,
    },
    {
      label: "Modify Vote",
      variant: "outline",
      onClick: logAction("Modify Vote"),
      className: "w-full bg-white/3",
      icon: <PencilLine className="size-4" />,
    },
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="h3 text-xl font-semibold text-foreground">
        Governance Actions
      </h3>
      <p className="text-sm text-white/50">
        Note: To create a proposal, you must use the validator&apos;s identity
        keypair when executing commands.
      </p>
      <ActionGrid
        actions={actions}
        gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
      />
    </div>
  );
}

function StakerActionsContent() {
  const actions: ActionButtonConfig[] = [
    {
      label: "Cast Vote",
      variant: "gradient",
      onClick: logAction("Cast Vote"),
      className: "w-full font-semibold",
      icon: <VoteIcon className="size-4" />,
    },
    {
      label: "Modify Vote",
      variant: "outline",
      onClick: logAction("Modify Vote"),
      className: "w-full bg-white/3",
      icon: <PencilLine className="size-4" />,
    },
  ];

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-foreground mb-4">
        Governance Actions
      </h3>
      <p className="text-sm text-white/50 mb-auto">
        As a staker, you can participate in governance by voting on proposals.
      </p>
      <ActionGrid
        actions={actions}
        gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
      />
    </div>
  );
}

export function GovernanceActions({ variant }: GovernanceActionsProps) {
  if (variant === "validator") {
    return <ValidatorActionsContent />;
  }

  return <StakerActionsContent />;
}
