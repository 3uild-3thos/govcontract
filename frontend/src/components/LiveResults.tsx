import { RealmsLink } from "./ui";

export const LiveResults = () => {
  return (
    <div>
      <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-3">
        LIVE RESULTS
      </div>

      <div className="flex flex-col gap-y-4 md:mb-4">
        {/* Yes Vote */}
        <div className="rounded-xl bg-black border-green-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div className="bg-green-dark w-[35%] absolute left-0 h-full z-0 border-r-[1px] border-r-green-secondary" />
          <div className="flex flex-col md:flex-row justify-between md:items-center md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-green">Yes</span>
              <span>35%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">1,639,657 SOL</div>
          </div>
        </div>

        {/* No Vote */}
        <div className="rounded-xl bg-black border-red-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div className="bg-red-dark w-[10%] absolute left-0 h-full z-0 border-r-[1px] border-r-red-secondary" />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-red">No</span>
              <span>10%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">496,215 SOL</div>
          </div>
        </div>

        {/* Abstain Vote */}
        <div className="rounded-xl bg-black border-orange-secondary border-[1px] py-3 px-4 md:p-4 flex items-center relative overflow-hidden">
          {/* progress */}
          <div className="bg-orange-dark w-[5%] absolute left-0 h-full z-0 border-r-[1px] border-r-orange-secondary" />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-orange">Abstain</span>
              <span>5%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">496,215 SOL</div>
          </div>
        </div>

        {/* Undecided Vote */}
        <div className="rounded-xl bg-black border-gray-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div className="bg-gray-dark w-[50%] absolute left-0 h-full z-0 border-r-[1px] border-r-gray-secondary" />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-gray">Undecided</span>
              <span>50%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">496,215 SOL</div>
          </div>
        </div>
      </div>

      <RealmsLink className="max-md:hidden" />
    </div>
  );
};
