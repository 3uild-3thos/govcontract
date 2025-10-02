import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ShadcnVariants =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
type CustomVariants = "gradient";
type AllVariants = ShadcnVariants | CustomVariants;

type AppButtonProps = Omit<
  React.ComponentProps<typeof ShadcnButton>,
  "variant" | "size" | "children"
> & {
  variant?: AllVariants;
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  text?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  loadingIcon?: React.ReactNode;
  children?: React.ReactNode;
};

// Only override the variants that are actually different from shadcn defaults
const variantOverrides: Record<string, string> = {
  destructive:
    "text-white dark:bg-destructive dark:hover:bg-destructive/90 disabled:hover:bg-destructive",
  outline:
    "border-white/13 bg-transparent hover:bg-white/13 hover:text-foreground hover:border-white/13 sm:hover:[background:var(--color-dao-gradient-hover)] sm:hover:text-foreground/90 sm:hover:border-[var(--color-dao-gradient-hover-border)] disabled:hover:bg-transparent disabled:hover:border-white/13 shadow-none dark:border-white/13 transition-all duration-200",
  gradient:
    "bg-gradient-to-r from-primary to-secondary text-foreground sm:hover:brightness-110 transition-all duration-200 disabled:hover:brightness-100",
};

const sizeOverrides: Record<string, string> = {
  default: "has-[>svg]:px-6",
  sm: "has-[>svg]:px-6 px-4",
  lg: "has-[>svg]:px-6",
};

export function AppButton({
  className,
  variant = "default",
  size = "default",
  text,
  icon,
  iconPosition = "left",
  children,
  isLoading = false,
  loadingIcon,
  ...props
}: AppButtonProps) {
  const baseVariant = variant === "gradient" ? "default" : variant;

  const overrideClasses = cn(
    "rounded-lg cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed",
    variantOverrides[variant as string] || "",
    sizeOverrides[size] || "",
  );

  const { disabled, ...buttonProps } = props;
  const resolvedDisabled = Boolean(disabled || isLoading);

  const resolvedLoader = loadingIcon ?? (
    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
  );

  const defaultContent = (
    <>
      {iconPosition === "left" && icon}
      {text}
      {iconPosition === "right" && icon}
    </>
  );

  const buttonContent = isLoading ? (
    <>
      {resolvedLoader} Loading...
      <span className="sr-only">
        {typeof text === "string" ? text : "Loading"}
      </span>
    </>
  ) : (
    children || defaultContent
  );

  return (
    <ShadcnButton
      variant={baseVariant as ShadcnVariants}
      size={size}
      className={cn(overrideClasses, className)}
      disabled={resolvedDisabled}
      aria-busy={isLoading || undefined}
      {...buttonProps}
    >
      {buttonContent}
    </ShadcnButton>
  );
}
