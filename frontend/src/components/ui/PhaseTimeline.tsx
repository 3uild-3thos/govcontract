import { Aperture, MessageSquareText, Vote } from "lucide-react";

export const PhaseTimeline = () => {
  return (
    <>
      <div className="flex px-5">
        {/* phase 1 */}
        <div className="flex items-center relative w-[33%]">
          <div className="w-10.5 h-10.5 bg-green-dark rounded-full border-green-secondary border-[1px] z-1 flex items-center justify-center">
            <MessageSquareText size={18} className="text-green-icon" />
          </div>
          <div className="absolute left-10 h-1.5 w-[calc(100%-theme(spacing.9))] bg-green-dark border-green-secondary border-[1px]" />
        </div>
        {/* phase 2 */}
        <div className="flex items-center relative w-[33%]">
          <div className="w-10.5 h-10.5 bg-green-dark rounded-full border-green-secondary border-[1px] z-1 flex items-center justify-center">
            <MessageSquareText size={18} className="text-green-icon" />
          </div>
          <div className="absolute left-10 h-1.5 w-[calc(100%-theme(spacing.9))] bg-green-dark border-green-secondary border-[1px]" />
        </div>
        {/* phase 3 */}
        <div className="flex items-center relative w-[33%]">
          <div className="w-10.5 h-10.5 bg-green-dark rounded-full border-green-secondary border-[1px] z-1 flex items-center justify-center">
            <Aperture size={18} className="text-green-icon-active" />
          </div>
          <div className="absolute left-10 h-1.5 w-[calc(100%-theme(spacing.9))] bg-black border-gray-secondary border-[1px]"></div>
          <div className="absolute left-10 h-1.5 w-[calc(50%-theme(spacing.4))] bg-gradient-to-r from-green-dark to-green border-green-secondary border-[1px] rounded-full" />
        </div>
        {/* phase 4 */}
        <div className="flex items-center relative">
          <div className="w-10.5 h-10.5 bg-black rounded-full border-gray-secondary border-[1px] z-1 flex items-center justify-center">
            <Vote size={18} className="text-dao-text-label" />
          </div>
        </div>
      </div>

      <div className="flex relative mt-2 ml-2">
        <div className="flex flex-col items-center">
          <span>Planning</span>
          <span className="text-dao-text-secondary text-xs">Epoch: 750</span>
          <span className="text-dao-text-secondary text-xs">120 Days</span>
        </div>
        <div className="absolute flex flex-col items-center left-[33%] transform -translate-x-[33%]">
          <span>Discussion</span>
          <span className="text-dao-text-secondary text-xs">Epoch: 750</span>
          <span className="text-dao-text-secondary text-xs">60 Days</span>
        </div>
        <div className="absolute flex flex-col items-center left-[66%] transform -translate-x-[66%]">
          <span>Snapshot</span>
          <span className="text-dao-text-secondary text-xs">Epoch: 750</span>
          <span className="text-dao-text-secondary text-xs">23 Days</span>
        </div>
        <div className="absolute flex flex-col items-center left-[98.5%] transform -translate-x-[98.5%]">
          <span>Voting</span>
          <span className="text-dao-text-secondary text-xs text-nowrap">
            Epoch: 750
          </span>
          <span className="text-dao-text-secondary text-xs">60 Days</span>
        </div>
      </div>
    </>
  );
};
