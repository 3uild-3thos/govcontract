import { renderHook } from "@testing-library/react";
import { useProposalSimd } from "../useProposalSimd";

describe("useProposalSimd", () => {
  it("extracts SIMD code from a standard proposal URL", () => {
    const { result } = renderHook(() =>
      useProposalSimd(
        "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0075-token22.md"
      )
    );
    expect(result.current).toBe("0075");
  });

  it("extracts SIMD code from a standard proposal URL with 5 digit simd", () => {
    const { result } = renderHook(() =>
      useProposalSimd(
        "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/00754-token22.md"
      )
    );
    expect(result.current).toBe("00754");
  });

  it("works regardless of directory structure", () => {
    const { result } = renderHook(() =>
      useProposalSimd(
        "https://github.com/org/repo/blob/dev/specs/subdir/0123-some-feature.md"
      )
    );
    expect(result.current).toBe("0123");
  });

  it("returns undefined for invalid URLs", () => {
    const { result } = renderHook(() =>
      useProposalSimd("https://github.com/org/repo/tree/main/0123-something.md")
    );
    expect(result.current).toBeUndefined();
  });

  it("returns undefined if filename doesn’t start with a number", () => {
    const { result } = renderHook(() =>
      useProposalSimd(
        "https://github.com/org/repo/blob/main/specs/something.md"
      )
    );
    expect(result.current).toBeUndefined();
  });

  it("reacts to URL changes", () => {
    const { result, rerender } = renderHook(({ url }) => useProposalSimd(url), {
      initialProps: {
        url: "https://github.com/org/repo/blob/main/0001-init.md",
      },
    });
    expect(result.current).toBe("0001");

    rerender({
      url: "https://github.com/org/repo/blob/main/0002-update.md",
    });
    expect(result.current).toBe("0002");
  });
});
