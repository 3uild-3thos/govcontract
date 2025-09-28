import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  children?: React.ReactNode;
};

// Only override the variants that are actually different from shadcn defaults
const variantOverrides: Record<string, string> = {
  destructive:
    "text-white dark:bg-destructive dark:hover:bg-destructive/90 disabled:hover:bg-destructive",
  outline:
    "border-white/15 bg-transparent hover:[background:var(--color-dao-gradient-hover)] hover:text-foreground/90 hover:border-[var(--color-dao-gradient-hover-border)] disabled:hover:bg-transparent disabled:hover:border-white/15 shadow-none dark:border-white/15 transition-all duration-200",
  gradient:
    "bg-gradient-to-r from-primary to-secondary text-foreground hover:brightness-110 transition-all duration-200 disabled:hover:brightness-100",
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
  ...props
}: AppButtonProps) {
  const baseVariant = variant === "gradient" ? "default" : variant;

  const overrideClasses = cn(
    "rounded-lg cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed",
    variantOverrides[variant as string] || "",
    sizeOverrides[size] || "",
  );

  const buttonContent = children || (
    <>
      {iconPosition === "left" && icon}
      {text}
      {iconPosition === "right" && icon}
    </>
  );

  return (
    <ShadcnButton
      variant={baseVariant as ShadcnVariants}
      size={size}
      className={cn(overrideClasses, className)}
      {...props}
    >
      {buttonContent}
    </ShadcnButton>
  );
}
