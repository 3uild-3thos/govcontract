import { classed } from "@tw-classed/react";

const CellRoot = classed.div("flex justify-between text-sm");

const Title = classed.span("text-dao-text-primary font-semibold");

const Description = classed.span("text-dao-text-label");

export const Cell = Object.assign(CellRoot, {
  Title: Title,
  Description: Description,
});
