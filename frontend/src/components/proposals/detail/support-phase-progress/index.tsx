"use client";

import { useMemo } from "react";
import { formatSOL } from "@/lib/governance/formatters";
import { calculateVotingEndsIn } from "@/helpers";
import { ProposalRecord } from "@/types";
import {
  buildSupportFilters,
  useGetValidators,
  useMounted,
  useSupportAccounts,
  useEpochToDate,
} from "@/hooks";
import { NotificationButton } from "./NotificationButton";
import { PhaseStatusBadge } from "./PhaseStatusBadge";
import { SupportDonut } from "./SupportDonut";
import { StatBadge, StatCard } from "./StatCard";

// ============================================================================
// Configuration - These will be replaced with real data later
// ============================================================================

/** Support threshold as percentage of total staked SOL (e.g., 10 = 10%) */
const SUPPORT_THRESHOLD_PERCENT = 10;

/** Mock total active staked SOL across the network (in lamports) */
// const MOCK_TOTAL_STAKED_LAMPORTS = 316_010_000 * LAMPORTS_PER_SOL; // 316.01M SOL

/** Mock total number of validators in the network */
// const MOCK_TOTAL_VALIDATORS = 2300;

interface SupportPhaseProgressProps {
  proposal: ProposalRecord;
}

export function SupportPhaseProgress({ proposal }: SupportPhaseProgressProps) {
  const mounted = useMounted();
  const hasEnded =
    proposal.status === "failed" || proposal.status === "finalized";

  // Calculate target epoch: creationEpoch + 3
  // 3 epochs for discussion, so end epoch is creationEpoch + 4
  const targetEpoch = proposal.creationEpoch + 4;

  const { data: supportEndsAt, isLoading: isLoadingEpochDate } =
    useEpochToDate(targetEpoch);

  const supportFilters = buildSupportFilters(
    proposal.publicKey.toBase58(),
    null
  );

  const fetchSupportAccountsEnabled = supportFilters.length > 0; // at least one filter is required

  const { data: supportAccounts = [], isLoading: isLoadingSupportAccounts } =
    useSupportAccounts(supportFilters, fetchSupportAccountsEnabled);

  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();

  // TODO: check if we should use calculated support instead of proposal.clusterSupportLamports
  // clusterSupportLamports is probably more accurate since its the validators stake at the moment of support
  // For each supportAccount, match with validator to get their stake and sum all stake
  //   const totalSupportedStake = useMemo(() => {
  //     if (!supportAccounts || !validators) return 0;
  //     // Create a map for quick lookup of validator by publicKey (base58 string)
  //     const validatorMap = new Map(
  //       validators.map((v) => [v.vote_identity, v.activated_stake])
  //     );
  //     // Each supportAccount.validator is a PublicKey object or string
  //     return supportAccounts.reduce((sum, supportAccount) => {
  //       // supportAccount.validator could be a PublicKey or string
  //       const validatorKey =
  //         typeof supportAccount.validator === "string"
  //           ? supportAccount.validator
  //           : supportAccount.validator?.toBase58?.();
  //       if (!validatorKey) return sum;
  //       const stake = validatorMap.get(validatorKey) || 0;
  //       return sum + stake;
  //     }, 0);
  //   }, [supportAccounts, validators]);

  const numOfValidators = useMemo(() => validators?.length || 0, [validators]);
  const validatorsStake = useMemo(
    () => validators?.reduce((acc, curr) => acc + curr.activated_stake, 0) || 0,
    [validators]
  );

  const isLoading =
    isLoadingValidators || isLoadingSupportAccounts || isLoadingEpochDate;

  // Calculate time remaining using existing helper
  const timeRemaining =
    mounted && supportEndsAt
      ? calculateVotingEndsIn(supportEndsAt.toISOString())
      : null;

  const stats = useMemo(() => {
    // Use proposal's clusterSupportLamports as current support
    const currentSupportLamports = proposal.clusterSupportLamports;
    const totalStakedLamports = validatorsStake;
    const thresholdPercent = SUPPORT_THRESHOLD_PERCENT;

    // Calculate required threshold in lamports
    const requiredThresholdLamports =
      totalStakedLamports * (thresholdPercent / 100);

    // Progress toward threshold (can exceed 100%)
    const progressPercent =
      requiredThresholdLamports > 0
        ? (currentSupportLamports / requiredThresholdLamports) * 100
        : 0;

    // Support as percent of total staked
    const supportPercentOfTotal =
      totalStakedLamports > 0
        ? (currentSupportLamports / totalStakedLamports) * 100
        : 0;

    // Remaining SOL needed (0 if threshold met)
    const remainingLamports = Math.max(
      0,
      requiredThresholdLamports - currentSupportLamports
    );

    // Is threshold met?
    const isThresholdMet = currentSupportLamports >= requiredThresholdLamports;

    const validatorCount = supportAccounts.length;
    const participationPercent = (validatorCount / numOfValidators) * 100;
    const avgStakePerValidator =
      validatorCount > 0 ? currentSupportLamports / validatorCount : 0;

    return {
      currentSupportLamports,
      totalStakedLamports,
      requiredThresholdLamports,
      thresholdPercent,
      progressPercent,
      supportPercentOfTotal,
      remainingLamports,
      isThresholdMet,
      validatorCount,
      participationPercent,
      avgStakePerValidator,
    };
  }, [
    numOfValidators,
    proposal.clusterSupportLamports,
    supportAccounts.length,
    validatorsStake,
  ]);

  // Determine banner state
  const showBanner = stats.progressPercent >= 80 || stats.isThresholdMet;
  const bannerMessage = stats.isThresholdMet
    ? "Support threshold reached! Proposal advancing to next phase."
    : `This proposal is nearing its support threshold. Only ${formatSOL(
        stats.remainingLamports
      )} SOL needed!`;

  // Format end date with time
  const formattedEndDate = supportEndsAt
    ? supportEndsAt.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      })
    : "--";

  return (
    <div className="glass-card flex h-full flex-col p-6 md:p-6 lg:p-8">
      {/* Header - Mobile: title full width, status left + icon right below */}
      {/* Desktop: title + icon left, status right */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Desktop: title + notification button together */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            Support Phase Progress
          </h3>
          {/* Notification button - hidden on mobile, shown on desktop */}
          <div className="hidden sm:block">
            <NotificationButton
              isVisible={showBanner}
              isThresholdMet={stats.isThresholdMet}
              message={bannerMessage}
            />
          </div>
        </div>
        {/* Mobile: status left, icon right / Desktop: status only */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <PhaseStatusBadge status={proposal.status} />
          {/* Notification button - shown on mobile only */}
          <div className="sm:hidden">
            <NotificationButton
              isVisible={showBanner}
              isThresholdMet={stats.isThresholdMet}
              message={bannerMessage}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-stretch">
        {/* Donut Chart */}
        <div className="flex flex-1 items-center justify-center">
          <SupportDonut
            currentSupportLamports={stats.currentSupportLamports}
            requiredThresholdLamports={stats.requiredThresholdLamports}
          />
        </div>

        {/* Stats Grid */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Current Support */}
            <StatCard
              label="Current Support"
              value={
                isLoading ? (
                  <div className="my-1 w-14 h-6 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  `${formatSOL(stats.currentSupportLamports)} SOL`
                )
              }
              badge={
                isLoading ? (
                  <div className="my-1 w-10 h-4 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  <StatBadge variant="primary">
                    {stats.supportPercentOfTotal.toFixed(2)}%
                  </StatBadge>
                )
              }
              progressBar={{
                percent: stats.supportPercentOfTotal,
                colorClass: "bg-gradient-to-r from-primary to-emerald-500",
              }}
            />

            {/* Required Threshold */}
            <StatCard
              label="Required Threshold"
              value={
                isLoading ? (
                  <div className="my-1 w-14 h-6 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  `${formatSOL(stats.requiredThresholdLamports)} SOL`
                )
              }
              badge={
                isLoading ? (
                  <div className="my-1 w-10 h-4 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  <StatBadge variant="purple">
                    {stats.thresholdPercent}%
                  </StatBadge>
                )
              }
              secondaryText={
                isLoading ? (
                  <div className="my-1 w-20 h-2 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  `${formatSOL(stats.totalStakedLamports)} total staked`
                )
              }
            />

            {/* Time Remaining */}
            <StatCard
              label={hasEnded ? "Support Phase" : "Time Remaining"}
              value={
                isLoading ? (
                  <div className="my-1 w-18 h-6 animate-pulse bg-white/10 rounded-full" />
                ) : hasEnded ? (
                  "Ended"
                ) : (
                  timeRemaining || "--"
                )
              }
              secondaryText={
                isLoading ? (
                  <div className="my-1 w-20 h-2 animate-pulse bg-white/10 rounded-full" />
                ) : hasEnded ? (
                  `Ended ${formattedEndDate}`
                ) : (
                  `Ends ${formattedEndDate}`
                )
              }
            />

            {/* Validator Participation */}
            <StatCard
              label="Validator Participation"
              value={
                isLoading ? (
                  <div className="my-1 w-14 h-6 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  `${stats.participationPercent.toFixed(1)}%`
                )
              }
              badge={
                isLoading ? (
                  <div className="my-1 w-10 h-4 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  <StatBadge variant="primary">
                    {stats.validatorCount} validators
                  </StatBadge>
                )
              }
              secondaryText={
                isLoading ? (
                  <div className="my-1 w-20 h-2 animate-pulse bg-white/10 rounded-full" />
                ) : (
                  `${formatSOL(
                    stats.avgStakePerValidator
                  )} SOL avg per validator`
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
