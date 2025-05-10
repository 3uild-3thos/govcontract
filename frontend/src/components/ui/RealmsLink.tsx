import { NorthEastOutlinedIcon, RealmsTextIcon } from "../icons";
import { classed, ComponentProps } from "@tw-classed/react";

export const RealmsLink = ({ ...props }: ComponentProps<typeof Wrapper>) => {
  return (
    <Wrapper {...props}>
      <RealmsTextIcon />
      <NorthEastOutlinedIcon />
    </Wrapper>
  );
};

const Wrapper = classed.div(
  "flex items-center gap-x-1.5 gradient-bg w-fit py-1 px-1.5"
);
