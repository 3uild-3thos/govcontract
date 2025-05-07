import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "shadow-sm overflow-hidden",
        "rounded-xl",
        "border border-dao-border",
        "bg-gradient-to-b from-black to-[#101010]",
        "p-4 md:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
