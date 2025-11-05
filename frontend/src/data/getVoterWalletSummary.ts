import { buildSolgovUrl, VoterSummaryResponse } from "@/chain";
import { RPCEndpoint } from "@/types";

export const getVoterWalletSummary = async (
  network: RPCEndpoint,
  walletAddress: string | undefined,
  slot: number
): Promise<VoterSummaryResponse> => {
  if (walletAddress === undefined) throw new Error("Wallet not connected");

  const url = buildSolgovUrl(
    `voter/${walletAddress}?network=${network}&slot=${slot}`
  );
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get voter summary: ${response.statusText}`);
  }

  return await response.json();
};
