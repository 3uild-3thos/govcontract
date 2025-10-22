import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSimdProposalDescription } from "../useSimdProposalDescription";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

// Helper to wrap hook in QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = "QueryClientWrapper";

  return Wrapper;
};

describe("useSimdProposalDescription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("returns summary from GitHub for valid URL", async () => {
    const githubUrl =
      "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0022-multi-stake.md";

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => `
---
simd: '0022'
title: Multi Delegation Stake Account
---
## Summary
This is the summary text
`,
    });

    const { result } = renderHook(() => useSimdProposalDescription(githubUrl), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.summary).toBe("This is the summary text");

    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("uses cached summary from localStorage", async () => {
    const githubUrl =
      "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0022-multi-stake.md";

    // Prepopulate cache
    localStorage.setItem(
      "simd_proposals_cache_v1",
      JSON.stringify({
        "0022": {
          simd: "0022",
          summary: "Cached summary",
          fetchedAt: Date.now(),
        },
      })
    );

    const { result } = renderHook(() => useSimdProposalDescription(githubUrl), {
      wrapper: createWrapper(),
    });

    await waitFor(() => !result.current.isLoading);

    expect(result.current.data?.summary).toBe("Cached summary");
    expect(fetch).not.toHaveBeenCalled();
  });

  // TODO: PEDRO depends if we want to enforce solana-foundation repo for the proposals' description github url
  it.skip("throws error for invalid GitHub URL", async () => {
    const githubUrl = "https://github.com/invalid-url.md";

    const { result } = renderHook(() => useSimdProposalDescription(githubUrl), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
