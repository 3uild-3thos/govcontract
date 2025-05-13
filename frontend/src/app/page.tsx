"use client";

import Image from "next/image";
import {
  Card,
  CurrentPhase,
  Footer,
  GradientBox,
  ProposalDetails,
  Quorum,
  RealmsIcon,
  SolanaIcon,
  TopVoters,
  ValidatorDetail,
} from "@/components";
import { useIsBelowMd } from "@/hooks";
import { TopVotersMobile } from "@/components/TopVotersMobile";

export default function Home() {
  const belowMd = useIsBelowMd();
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <header className="relative flex flex-col gap-y-5 md:gap-y-7 items-center justify-center pt-7 pb-9 md:pb-11 px-8 md:px-0">
        <div className="absolute top-0 inset-0 -z-1">
          <Image
            src="/assets/header-image.jpg"
            alt="Header Background"
            fill
            className="object-cover w-auto h-full max-h-[140px] md:max-h-full min-w-full"
            priority
          />
        </div>
        <div className="flex gap-x-3">
          <GradientBox>
            <SolanaIcon />
          </GradientBox>
          <GradientBox>
            <RealmsIcon />
          </GradientBox>
        </div>

        <div className="flex flex-col text-center gap-y-3 max-w-[512px]">
          <span className="text-[32px] font-bold bg-gradient-to-b from-white to-[#737373] inline-block text-transparent bg-clip-text">
            Solana Validator Governance
          </span>
          <span className="text-md text-dao-text-muted">
            Check the latest proposal, see the live results and signal your
            opinion to the Solana Network.
          </span>
        </div>
      </header>
      <main className="flex flex-col gap-y-5 md:gap-y-9 max-w-7xl mx-auto p-4 mb-50">
        <Card>
          <ProposalDetails />
        </Card>
        {!belowMd && (
          <Card>
            <Quorum />
          </Card>
        )}
        {!belowMd && (
          <Card>
            <CurrentPhase />
          </Card>
        )}
        {!belowMd && (
          <Card>
            <TopVoters />
          </Card>
        )}
        {!belowMd && (
          <Card>
            <ValidatorDetail />
          </Card>
        )}

        {belowMd && (
          <Card>
            <TopVotersMobile />
          </Card>
        )}
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
}
