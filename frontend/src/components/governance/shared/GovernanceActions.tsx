import { AppButton } from "@/components/ui/AppButton";
import { ViewType } from "@/types/governance";
import {
  PencilLine,
  PlusCircle,
  ThumbsUp,
  MapPinCheckInside,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GovernanceActionsProps {
  variant: ViewType;
  title?: string;
  description?: string;
  gridClassName?: string;
  wrapperClassName?: string;
  className?: string;
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

function ActionGrid({ actions, gridClassName }: ActionGridProps) {
  return (
    <div className={gridClassName}>
      {actions.map((action) => (
        <AppButton
          key={action.label}
          text={action.label}
          variant={action.variant}
          onClick={() => {
            action.onClick();
          }}
          className={action.className}
          icon={action.icon}
          size="lg"
        />
      ))}
    </div>
  );
}

function openCreateProposalModal() {
  return () => toast.success("Proposal created successfully");
}

function openSupportProposalModal() {
  return () => console.log("Support Proposal");
}

function openCastVoteModal() {
  return () => console.log("Cast Vote");
}

function openModifyVoteModal() {
  return () => console.log("Modify Vote");
}

const validatorConfig = {
  title: "Governance Actions",
  description:
    "Note: To create a proposal, you must use the validator's identity keypair when executing commands.",
  wrapperClassName: "glass-card p-6 space-y-4",
  descriptionClassName: "text-sm text-white/60",
  gridClassName: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  actions: [
    {
      label: "Create Proposal",
      variant: "gradient",
      onClick: openCreateProposalModal(),
      className: "w-full font-semibold",
      icon: <PlusCircle className="size-4" />,
    },
    {
      label: "Support Proposal",
      variant: "outline",
      onClick: openSupportProposalModal(),
      className:
        "w-full border-0 bg-white/12 sm:border sm:border-white/15 sm:bg-white/3",
      icon: <ThumbsUp className="size-4" />,
    },
    {
      label: "Cast Vote",
      variant: "outline",
      onClick: openCastVoteModal(),
      className:
        "w-full border-0 bg-white/12 sm:border sm:border-white/15 sm:bg-white/3",
      icon: <MapPinCheckInside className="size-4" />,
    },
    {
      label: "Modify Vote",
      variant: "outline",
      onClick: openModifyVoteModal(),
      className:
        "w-full border-0 bg-white/12 sm:border sm:border-white/15 sm:bg-white/3",
      icon: <PencilLine className="size-4" />,
    },
  ] satisfies ActionButtonConfig[],
};

const stakerConfig = {
  title: "Governance Actions",
  description:
    "As a staker, you can participate in governance by voting on proposals.",
  wrapperClassName: "glass-card p-6 space-y-4 h-full",
  descriptionClassName: "text-sm text-white/60",
  gridClassName: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  actions: [
    {
      label: "Cast Vote",
      variant: "gradient",
      onClick: openCastVoteModal(),
      className: "w-full font-semibold",
      icon: <MapPinCheckInside className="size-4" />,
    },
    {
      label: "Modify Vote",
      variant: "outline",
      onClick: openModifyVoteModal(),
      className:
        "w-full border-0 bg-white/12 sm:border sm:border-white/15 sm:bg-white/3",
      icon: <PencilLine className="size-4" />,
    },
  ] satisfies ActionButtonConfig[],
};

export function GovernanceActions({
  variant,
  title,
  description,
  gridClassName,
  wrapperClassName,
  className,
}: GovernanceActionsProps) {
  const config = variant === "validator" ? validatorConfig : stakerConfig;
  const resolvedTitle = title ?? config.title;
  const resolvedDescription =
    description === undefined ? config.description : description;
  const resolvedWrapperClassName = cn(
    wrapperClassName ?? config.wrapperClassName,
    className,
  );
  const resolvedGridClassName = gridClassName ?? config.gridClassName;

  return (
    <div className={resolvedWrapperClassName}>
      <div className="space-y-2">
        <h3 className="h3 font-semibold">{resolvedTitle}</h3>
        {resolvedDescription && (
          <p className={config.descriptionClassName}>{resolvedDescription}</p>
        )}
      </div>
      <ActionGrid
        actions={config.actions}
        gridClassName={resolvedGridClassName}
      />
    </div>
  );
}
