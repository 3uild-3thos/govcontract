import { SearchIcon, VoteIcon, PlusIcon } from "lucide-react";
import { AppButton } from "../ui/AppButton";

export default function examples() {
  return (
    <div>
      <h2 className="h2">Stake Accounts</h2>
      <div className="rounded-2xl p-6 mt-12 glass-card ">
        <h3 className="h3 font-plus-jakarta-sans">Stake Accounts</h3>
        <h4 className="h4">Stake Accounts</h4>
        <h5 className="h5">Stake Accounts</h5>
        <p className="p text-muted">Stake Accounts</p>
        <small className="small text-muted">Stake Accounts</small>
      </div>
      <div>
        <form className="mt-6 flex mx-auto gap-2">
          <input type="text" placeholder="Search" className="input" />
          <div className="flex gap-2">
            <AppButton
              type="submit"
              variant="outline"
              size="default"
              className="w-1/2 "
              text="Search"
            />
            <AppButton
              type="submit"
              variant="gradient"
              size="default"
              className="rounded-full"
              text="Search"
              icon={<SearchIcon className="size-4" />}
              disabled
            />
            <AppButton
              type="submit"
              variant="outline"
              size="default"
              text="Cast Vote"
              icon={<VoteIcon className="size-4" />}
            />
            <AppButton
              type="submit"
              variant="destructive"
              size="default"
              text="Add Stake Account"
              icon={<PlusIcon className="size-4" />}
              disabled
            />
          </div>
        </form>
      </div>
    </div>
  );
}
