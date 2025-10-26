// export type VoteOutcome = "for" | "against" | "abstain";

import BN from "bn.js";

export interface TopVoterRecord {
  id: string;
  validatorName: string;
  validatorIdentity: string;
  stakedLamports: number;
  // voteOutcome: VoteOutcome;
  votePercentage: number;
  voteTimestamp: string;
  voteData: {
    forVotesBp: BN;
    againstVotesBp: BN;
    abstainVotesBp: BN;
  };
  accentColor: string;
}

const accentColors = [
  "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
  "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
  "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
];

const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % accentColors.length;
  return accentColors[index];
};

export const topVoters: TopVoterRecord[] = [
  {
    id: "shinobi",
    validatorName: "Shinobi",
    validatorIdentity: "GU9GEdjq1YHDWFmb44fGSBen6iTbRuPYg8hBsrTA7J8c",
    stakedLamports: 1_200_000,
    // voteOutcome: "for",
    votePercentage: 6.81,
    voteTimestamp: "2023-11-15T14:23:00Z",
    voteData: {
      forVotesBp: new BN(6000),
      againstVotesBp: new BN(2000),
      abstainVotesBp: new BN(2000),
    },
    accentColor: getColorFromString("shinobi"),
  },
  {
    id: "stakin",
    validatorName: "Stakin",
    validatorIdentity: "JKvMiwT4qbQVXnvezFtyLiG5QqY4TPFRJPE6dm8idiN8",
    stakedLamports: 987_000,
    // voteOutcome: "for",
    votePercentage: 5.23,
    voteTimestamp: "2023-11-14T09:10:00Z",
    voteData: {
      forVotesBp: new BN(6000),
      againstVotesBp: new BN(2000),
      abstainVotesBp: new BN(2000),
    },
    accentColor: getColorFromString("stakin"),
  },
  {
    id: "everstake",
    validatorName: "Everstake",
    validatorIdentity: "QbhGZV8cYJJBgSUE9us4HwLAiWw9TG8R6mcMjmYYB2kA",
    stakedLamports: 765_000,
    // voteOutcome: "against",
    votePercentage: 4.05,
    voteTimestamp: "2023-11-13T18:45:00Z",
    voteData: {
      forVotesBp: new BN(2000),
      againstVotesBp: new BN(6000),
      abstainVotesBp: new BN(2000),
    },
    accentColor: getColorFromString("everstake"),
  },
  {
    id: "figment",
    validatorName: "Figment",
    validatorIdentity: "92jGF5FXGTo8LgHSAj4oWX8iNM83fF7pKTojk1BP9LpK",
    stakedLamports: 543_000,
    // voteOutcome: "abstain",
    votePercentage: 2.88,
    voteTimestamp: "2023-11-12T22:15:00Z",
    voteData: {
      forVotesBp: new BN(1000),
      againstVotesBp: new BN(1000),
      abstainVotesBp: new BN(8000),
    },
    accentColor: getColorFromString("figment"),
  },
  {
    id: "chorus-one",
    validatorName: "Chorus One",
    validatorIdentity: "TXQ1frfDyNj6nBWDe2be2ZY7GfQDRHWBjbMebpM1VWXq",
    stakedLamports: 1_450_000,
    // voteOutcome: "for",
    votePercentage: 7.96,
    voteTimestamp: "2023-11-15T03:40:00Z",
    voteData: {
      forVotesBp: new BN(9000),
      againstVotesBp: new BN(500),
      abstainVotesBp: new BN(500),
    },
    accentColor: getColorFromString("chorus-one"),
  },
  {
    id: "p2p",
    validatorName: "P2P.org",
    validatorIdentity: "qyJYnnGhXmLXwYPkFk6qdXGW3Dxx2AzqGWUJfMi1pmoQ",
    stakedLamports: 1_015_000,
    // voteOutcome: "for",
    votePercentage: 6.12,
    voteTimestamp: "2023-11-14T21:05:00Z",
    voteData: {
      forVotesBp: new BN(10000),
      againstVotesBp: new BN(0),
      abstainVotesBp: new BN(0),
    },
    accentColor: getColorFromString("p2p"),
  },
  {
    id: "rockawayx",
    validatorName: "RockawayX",
    validatorIdentity: "WaNaomugZdRUNib91sGF2ujij47GoeLwdCvbZBXgyUqB",
    stakedLamports: 812_000,
    // voteOutcome: "against",
    votePercentage: 4.61,
    voteTimestamp: "2023-11-13T11:30:00Z",
    voteData: {
      forVotesBp: new BN(1000),
      againstVotesBp: new BN(8000),
      abstainVotesBp: new BN(1000),
    },
    accentColor: getColorFromString("rockawayx"),
  },
  {
    id: "coinbase",
    validatorName: "Coinbase Cloud",
    validatorIdentity: "2Y4PfXNQm6Kdj8Ggr8QXkXNRX7ytzEhdRya6fF33dVSs",
    stakedLamports: 1_110_000,
    // voteOutcome: "for",
    votePercentage: 6.71,
    voteTimestamp: "2023-11-15T05:50:00Z",
    voteData: {
      forVotesBp: new BN(8000),
      againstVotesBp: new BN(1000),
      abstainVotesBp: new BN(1000),
    },
    accentColor: getColorFromString("coinbase"),
  },
  {
    id: "blockdaemon",
    validatorName: "Blockdaemon",
    validatorIdentity: "DpNRt3EphMTNaV5mqXVnWgY9tPWWsNjHGfQWU2CdGr1U",
    stakedLamports: 698_000,
    // voteOutcome: "abstain",
    votePercentage: 3.28,
    voteTimestamp: "2023-11-12T17:05:00Z",
    voteData: {
      forVotesBp: new BN(8000),
      againstVotesBp: new BN(1000),
      abstainVotesBp: new BN(1000),
    },
    accentColor: getColorFromString("blockdaemon"),
  },
  {
    id: "solana-foundation",
    validatorName: "Solana Foundation",
    validatorIdentity: "cfuneLZZZH1Vw4MQvKnRkcd4QdichNcNCf4Chui4e55q",
    stakedLamports: 1_980_000,
    // voteOutcome: "for",
    votePercentage: 10.45,
    voteTimestamp: "2023-11-15T01:25:00Z",
    voteData: {
      forVotesBp: new BN(8000),
      againstVotesBp: new BN(1000),
      abstainVotesBp: new BN(1000),
    },
    accentColor: getColorFromString("solana-foundation"),
  },
  {
    id: "kiln",
    validatorName: "Kiln",
    validatorIdentity: "DauLfwEpetmr92P4H3RPaKEo5hjdzfDhLdcebxK6P9ez",
    stakedLamports: 605_000,
    // voteOutcome: "for",
    votePercentage: 3.96,
    voteTimestamp: "2023-11-14T16:40:00Z",
    voteData: {
      forVotesBp: new BN(8000),
      againstVotesBp: new BN(1000),
      abstainVotesBp: new BN(1000),
    },
    accentColor: getColorFromString("kiln"),
  },
  {
    id: "stakefish",
    validatorName: "stakefish",
    validatorIdentity: "uRjXvFeibDqzxDGbXhJX17uKkbvDnnxCpbn65Cey2G8c",
    stakedLamports: 889_000,
    // voteOutcome: "against",
    votePercentage: 5.02,
    voteTimestamp: "2023-11-13T08:20:00Z",
    voteData: {
      forVotesBp: new BN(10000),
      againstVotesBp: new BN(8000),
      abstainVotesBp: new BN(1000),
    },
    accentColor: getColorFromString("stakefish"),
  },
];
