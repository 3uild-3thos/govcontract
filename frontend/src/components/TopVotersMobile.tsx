"use client";

import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  VotesBubbleChart,
} from "@/components";

import { useGetValidatorsTableMobile, type VoteTypeText } from "@/hooks";
import { useMemo, useState } from "react";

const voteColorMap: Record<string, string> = {
  Yes: "bg-green-500",
  No: "bg-red-500",
  Abstain: "bg-orange-500",
  None: "bg-gray-500",
};

export function TopVotersMobile() {
  const [filterBy, setFilterBy] = useState<VoteTypeText[]>([]);

  const { data: validators, isLoading } = useGetValidatorsTableMobile();

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleFilter = (filterValue: VoteTypeText) => {
    setFilterBy((prev) =>
      prev.includes(filterValue)
        ? prev.filter((p) => p !== filterValue)
        : prev.concat(filterValue)
    );
  };

  console.log("filterBy:", filterBy);

  const filteredData = useMemo(
    () =>
      validators?.filter((v) =>
        filterBy.length > 0 ? filterBy.includes(v.voteType) : validators
      ),
    [validators, filterBy]
  );

  if (isLoading) return <div>Loading...</div>;
  if (!filteredData) return <div>No data</div>;

  return (
    <div className="w-full text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Top Voters</h1>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-t border-dao-border">
              <TableHead className="text-dao-text-secondary font-normal">
                VALIDATOR
              </TableHead>
              <TableHead className="text-dao-text-secondary font-normal">
                VOTE
              </TableHead>
              <TableHead className="text-dao-text-secondary font-normal">
                VOTE WEIGHT
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData?.map((validator) => (
              <TableRow
                key={validator.address + validator.voteType}
                className="border-b border-dao-border"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3 font-medium">
                    {validator.address}
                  </div>
                </TableCell>
                <TableCell className="px-1">
                  <div className="flex gap-x-6">
                    <div className="flex items-center text-sm gap-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          voteColorMap[validator.voteType]
                        }`}
                      ></div>
                      <span className="text-dao-text-secondary">
                        {validator.voteType}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatNumber(validator.voteWeight)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex md:flex-row items-center mt-2 gap-4 text-sm px-2">
        Show:{" "}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="filter-yes"
            checked={filterBy.includes("Yes")}
            onCheckedChange={() => handleFilter("Yes")}
          />
          <label className="text-dao-text-secondary" htmlFor="filter-yes">
            Yes
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="filter-no"
            checked={filterBy.includes("No")}
            onCheckedChange={() => handleFilter("No")}
          />
          <label className="text-dao-text-secondary" htmlFor="filter-no">
            No
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="filter-abstain"
            checked={filterBy.includes("Abstain")}
            onCheckedChange={() => handleFilter("Abstain")}
          />
          <label className="text-dao-text-secondary" htmlFor="filter-abstain">
            Abstain
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="filter-none"
            checked={filterBy.includes("None")}
            onCheckedChange={() => handleFilter("None")}
          />
          <label className="text-dao-text-secondary" htmlFor="filter-none">
            None
          </label>
        </div>
      </div>

      <div className="flex items-center justify-center mt-10">
        <VotesBubbleChart />
      </div>
    </div>
  );
}
