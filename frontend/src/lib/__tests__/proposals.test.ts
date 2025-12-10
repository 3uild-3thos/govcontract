import { PublicKey } from "@solana/web3.js";
import { getProposalStatus } from "../proposals";
import type { GetProposalStatusParams } from "../proposals";

// Mock the SUPPORT_THRESHOLD_PERCENT constant
jest.mock("@/components/proposals/detail/support-phase-progress", () => ({
  SUPPORT_THRESHOLD_PERCENT: 10,
}));

describe("getProposalStatus", () => {
  const creationEpoch = 800;
  const totalStakedLamports = 100_000_000_000; // 100M SOL in lamports
  const requiredThresholdLamports = totalStakedLamports * 0.1; // 10% = 10M SOL
  const mockConsensusResult = new PublicKey("11111111111111111111111111111111");

  const baseParams: Omit<
    GetProposalStatusParams,
    "currentEpoch" | "clusterSupportLamports"
  > = {
    creationEpoch,
    totalStakedLamports,
    consensusResult: undefined,
    finalized: false,
    voting: false,
  };

  describe("finalized proposals", () => {
    it("should return 'finalized' when finalized is true, regardless of other params", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: 900,
        clusterSupportLamports: 0,
        finalized: true,
        voting: false,
      };

      expect(getProposalStatus(params)).toBe("finalized");
    });

    it("should return 'finalized' even if voting flag is true", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: 900,
        clusterSupportLamports: 0,
        finalized: true,
        voting: true,
      };

      expect(getProposalStatus(params)).toBe("finalized");
    });
  });

  describe("before support phase", () => {
    it("should return 'supporting' when currentEpoch is before support start", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch, // epoch 800, support starts at 801
        clusterSupportLamports: 0,
      };

      expect(getProposalStatus(params)).toBe("supporting");
    });

    it("should return 'supporting' when currentEpoch is less than creationEpoch + 1", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch - 1,
        clusterSupportLamports: 0,
      };

      expect(getProposalStatus(params)).toBe("supporting");
    });
  });

  describe("during support phase", () => {
    it("should return 'supporting' when currentEpoch equals support start epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 1, // epoch 801
        clusterSupportLamports: 0,
      };

      expect(getProposalStatus(params)).toBe("supporting");
    });
  });

  describe("at support end epoch (threshold check)", () => {
    it("should return 'failed' when threshold is not met at support end epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2, // epoch 802
        clusterSupportLamports: requiredThresholdLamports - 1, // Just below threshold
      };

      expect(getProposalStatus(params)).toBe("failed");
    });

    it("should return 'discussion' when threshold is met at support end epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2, // epoch 802
        clusterSupportLamports: requiredThresholdLamports, // Exactly at threshold
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });

    it("should return 'discussion' when threshold is exceeded at support end epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2, // epoch 802
        clusterSupportLamports: requiredThresholdLamports + 1_000_000, // Above threshold
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });
  });

  describe("during discussion phase", () => {
    it("should return 'discussion' at discussion start epoch (epoch 802)", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2, // epoch 802
        clusterSupportLamports: requiredThresholdLamports, // Threshold met
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });

    it("should return 'discussion' during middle of discussion phase (epoch 803)", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 3, // epoch 803
        clusterSupportLamports: requiredThresholdLamports,
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });

    it("should return 'discussion' at discussion end epoch (epoch 804)", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 4, // epoch 804
        clusterSupportLamports: requiredThresholdLamports,
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });
  });

  describe("snapshot phase", () => {
    it("should return 'discussion' at snapshot epoch (epoch 805)", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 5, // epoch 805
        clusterSupportLamports: requiredThresholdLamports,
        voting: true, // Threshold was met
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });
  });

  describe("past discussion phase - using voting flag", () => {
    it("should return 'failed' when voting flag is false after discussion phase", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 6, // epoch 806
        clusterSupportLamports: 0, // Threshold not met
        voting: false, // On-chain flag indicates not voting
      };

      expect(getProposalStatus(params)).toBe("failed");
    });

    it("should return 'failed' when voting flag is false at epoch 807", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 7,
        clusterSupportLamports: 0,
        voting: false,
      };

      expect(getProposalStatus(params)).toBe("failed");
    });
  });

  describe("voting phase - with consensusResult", () => {
    it("should return 'voting' when voting flag is true, consensusResult exists, and at voting start epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 6, // epoch 806
        clusterSupportLamports: requiredThresholdLamports,
        consensusResult: mockConsensusResult,
        voting: true,
      };

      expect(getProposalStatus(params)).toBe("voting");
    });

    it("should return 'voting' when voting flag is true, consensusResult exists, and past voting start epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 10, // epoch 810
        clusterSupportLamports: requiredThresholdLamports,
        consensusResult: mockConsensusResult,
        voting: true,
      };

      expect(getProposalStatus(params)).toBe("voting");
    });
  });

  describe("voting phase - without consensusResult (snapshot not ready)", () => {
    it("should return 'discussion' when voting flag is true but consensusResult is undefined at voting start epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 6, // epoch 806
        clusterSupportLamports: requiredThresholdLamports,
        consensusResult: undefined,
        voting: true,
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });

    it("should return 'discussion' when voting flag is true but consensusResult is undefined past voting start epoch", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 10,
        clusterSupportLamports: requiredThresholdLamports,
        consensusResult: undefined,
        voting: true,
      };

      expect(getProposalStatus(params)).toBe("discussion");
    });
  });

  describe("edge cases", () => {
    it("should handle zero total staked lamports", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2, // epoch 802
        totalStakedLamports: 0,
        clusterSupportLamports: 0,
      };

      // With zero total stake, threshold is 0, so any support should pass
      expect(getProposalStatus(params)).toBe("discussion");
    });

    it("should handle very large epoch numbers", () => {
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 1000,
        clusterSupportLamports: requiredThresholdLamports,
        consensusResult: mockConsensusResult,
        voting: true,
      };

      expect(getProposalStatus(params)).toBe("voting");
    });

    it("should return 'supporting' as fallback for unexpected epoch ranges", () => {
      // Test a realistic edge case at support start epoch
      const params: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 1,
        clusterSupportLamports: requiredThresholdLamports,
        voting: false,
      };

      expect(getProposalStatus(params)).toBe("supporting");
    });
  });

  describe("threshold calculation", () => {
    it("should correctly calculate threshold as 10% of total staked", () => {
      const testTotalStaked = 1_000_000_000; // 1M SOL
      const expectedThreshold = 100_000_000; // 10% = 100k SOL

      const paramsJustBelow: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2,
        totalStakedLamports: testTotalStaked,
        clusterSupportLamports: expectedThreshold - 1,
      };

      const paramsJustAbove: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2,
        totalStakedLamports: testTotalStaked,
        clusterSupportLamports: expectedThreshold,
      };

      expect(getProposalStatus(paramsJustBelow)).toBe("failed");
      expect(getProposalStatus(paramsJustAbove)).toBe("discussion");
    });
  });

  describe("phase transitions", () => {
    it("should transition correctly from supporting to discussion when threshold is met", () => {
      const supportPhase: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 1,
        clusterSupportLamports: requiredThresholdLamports,
      };

      const thresholdCheck: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2,
        clusterSupportLamports: requiredThresholdLamports,
      };

      expect(getProposalStatus(supportPhase)).toBe("supporting");
      expect(getProposalStatus(thresholdCheck)).toBe("discussion");
    });

    it("should transition correctly from supporting to failed when threshold is not met", () => {
      const supportPhase: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 1,
        clusterSupportLamports: requiredThresholdLamports - 1,
      };

      const thresholdCheck: GetProposalStatusParams = {
        ...baseParams,
        currentEpoch: creationEpoch + 2,
        clusterSupportLamports: requiredThresholdLamports - 1,
      };

      expect(getProposalStatus(supportPhase)).toBe("supporting");
      expect(getProposalStatus(thresholdCheck)).toBe("failed");
    });
  });
});
