import { Check } from "lucide-react";

export function CreatedNode() {
  return (
    <div className="flex flex-col items-center relative">
      <div className="relative flex items-center justify-center scale-75 sm:scale-85 md:scale-90 lg:scale-100">
        <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm transition-colors duration-300 bg-gradient-to-r from-primary/20 to-emerald-500/20 text-primary/30">
          <Check className="size-5" strokeWidth={3} />
        </span>
      </div>

      <span className="absolute top-full mt-2 lg:mt-3 text-xs text-white/50 transition-colors duration-300 text-center whitespace-normal sm:whitespace-nowrap max-w-[80px] sm:max-w-none">
        Created
      </span>
    </div>
  );
}
