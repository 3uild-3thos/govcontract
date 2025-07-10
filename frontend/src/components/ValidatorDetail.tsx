"use client";

import { VoteIcon } from "lucide-react";
import { Cell, Pill } from "./ui";
import { cn } from "@/lib/utils";
import { VotesBubbleChart } from "./VotesBubbleChart";
import { useGetValidatorsBubbleChart, ValidatorInfo } from "@/hooks";
import { useCallback, useEffect, useState } from "react";
import { roundDecimals } from "@/lib/helpers";

const splitColor: Record<string, string> = {
  yes: "bg-green-icon-active",
  no: "bg-red",
  abstain: "bg-orange",
  undecided: "bg-gray",
};

const voteTypeReadable: Record<string, string> = {
  yes: "Yes",
  no: "No",
  abstain: "Abstain",
  undecided: "Undecided",
};

export const ValidatorDetail = () => {
  const [selectedValidator, setSelectedValidator] = useState<
    ValidatorInfo | undefined
  >(undefined);

  const { data, isLoading } = useGetValidatorsBubbleChart();

  const handleSelectValidator = useCallback(
    (voteIdentity: string) => {
      const validator = data.validatorsInfo[voteIdentity];

      setSelectedValidator(validator);
    },
    [data.validatorsInfo]
  );

  useEffect(() => {
    if (!selectedValidator && data.votes.length > 0) {
      // pick selected node, first node
      const voteIdentity = data.votes[0].voteIdentity;
      const validator = Object.values(data.validatorsInfo)?.find(
        (v) => v.voteIdentity === voteIdentity
      );

      if (validator) {
        handleSelectValidator(validator.voteIdentity);
      }
    }
  }, [data, handleSelectValidator, selectedValidator]);

  return (
    <div className="grid md:grid-cols-2 gap-14">
      {/* Left Column - Detail */}
      <div className="md:border-b-0 border-b col-span-1">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-1">
          VALIDATOR DETAIL
        </div>

        <h1 className="text-2xl font-bold text-dao-text-primary mb-3 leading-tight">
          {selectedValidator?.name}
        </h1>

        <p className="text-sm text-dao-text-muted mb-2 md:mb-5 leading-relaxed">
          {selectedValidator?.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6 max-md:hidden">
          <Pill>
            <VoteIcon className="h-3.5 w-3.5" />
            {selectedValidator?.voteCount} Votes
          </Pill>
        </div>

        <div className="space-y-3 mb-7">
          <Cell className="max-md:hidden">
            <Cell.Title>{selectedValidator?.commission}%</Cell.Title>
            <Cell.Description>Comission</Cell.Description>
          </Cell>
          <hr className="h-[1px] border-dao-border" />
          <Cell>
            <Cell.Title>{selectedValidator?.asn}</Cell.Title>
            <Cell.Description>ASN</Cell.Description>
          </Cell>
          <hr className="h-[1px] border-dao-border" />
          <Cell>
            <Cell.Title>
              {selectedValidator?.staked.toLocaleString()} SOL
            </Cell.Title>
            <Cell.Description>Total Staked</Cell.Description>
          </Cell>
          <hr className="h-[1px] border-dao-border" />
        </div>

        <div className="text-md font-medium tracking-wider text-dao-text-secondary uppercase mb-5">
          VOTER SPLIT
        </div>
        <div className="flex justify-between">
          {selectedValidator &&
            Object.entries(selectedValidator.voterSplit).map(
              ([name, split]) => (
                <div
                  key={name}
                  className="flex flex-col p-3 gradient-bg !border-none !rounded-lg max-w-[117px] w-full"
                >
                  <div className="font-medium">
                    {roundDecimals(split.toString())}%
                  </div>
                  <div className="flex items-center text-sm gap-x-1">
                    <div
                      className={cn("w-2 h-2 rounded-full", splitColor[name])}
                    ></div>
                    <span className="text-dao-text-secondary">
                      {voteTypeReadable[name]}
                    </span>
                  </div>
                </div>
              )
            )}
        </div>
      </div>

      {/* Right Column - Bubble chart */}
      <div className="flex md:mt-2 col-span-1 justify-center items-center">
        <VotesBubbleChart
          votes={data.votes}
          isLoading={isLoading}
          selectedValidator={selectedValidator?.voteIdentity}
          handleSelectValidator={handleSelectValidator}
        />
      </div>
    </div>
  );
};
