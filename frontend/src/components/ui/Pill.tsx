import { classed } from "@tw-classed/react";

export const Pill = classed(
  "div",
  "flex items-center gap-1.5",
  "px-[8px] py-[7px]",
  "bg-dao-pill-bg border-dao-border border-[1px] rounded-md",
  "text-xs font-medium text-[#8E8F91]",
  "leading-none",
  {
    variants: {
      color: {
        green: "bg-green-dark text-green border-green-secondary",
      },
    },
  }
);
