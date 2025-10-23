import { useQuery, QueryFunctionContext } from "@tanstack/react-query";

interface SimdData {
  simd: string;
  summary: string;
  fetchedAt: number;
}

const STORAGE_KEY = "simd_proposals_cache_v1";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

// --- Helpers ---
function loadCache(): Record<string, SimdData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, SimdData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

function getFileNameFromGithubUrl(url: string) {
  // TODO: PEDRO check if we want to strictly check if it comes from this repo
  // const regex =
  //   /^https:\/\/github\.com\/solana-foundation\/solana-improvement-documents\/blob\/main\/proposals\/([^/]+)$/;
  // if (!match) throw new Error("Invalid GitHub proposal URL. Must match: https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/<filename>");

  const regex = /proposals\/([^/]+)$/;

  const match = url.match(regex);
  if (!match) throw new Error("Invalid GitHub proposal URL");
  return match[1];
}

function getSimdCode(fileName: string) {
  return fileName.replace(/^(\d+).*/, "$1");
}

async function fetchProposalFromGitHub({
  queryKey,
}: QueryFunctionContext<[string, string]>): Promise<SimdData> {
  const [, githubUrl] = queryKey;
  const fileName = getFileNameFromGithubUrl(githubUrl);
  const simdCode = getSimdCode(fileName);

  const url = `https://raw.githubusercontent.com/solana-foundation/solana-improvement-documents/main/proposals/${fileName}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch SIMD ${simdCode}: ${res.statusText}`);
  const text = await res.text();

  // Extract SIMD
  const frontmatterMatch = text.match(/^---([\s\S]*?)---/);
  let simd = simdCode;
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    const simdMatch = yaml.match(/simd:\s*['"]?(\d+)['"]?/);
    if (simdMatch) simd = simdMatch[1];
  }

  // Extract summary
  const summaryMatch = text.match(
    /##\s*Summary\s*\n([\s\S]*?)(?=\n##\s|\n#\s|$)/i
  );
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  const data = { simd, summary, fetchedAt: Date.now() };

  // Update cache
  const cache = loadCache();
  cache[simd] = data;
  saveCache(cache);

  return data;
}

export function useProposalSimdDescription(githubUrl: string) {
  return useQuery({
    queryKey: ["simd-proposal", githubUrl],
    queryFn: fetchProposalFromGitHub,
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
    initialData: () => {
      try {
        const fileName = getFileNameFromGithubUrl(githubUrl);
        const simdCode = getSimdCode(fileName);
        const cache = loadCache();
        const cached = cache[simdCode];
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;
      } catch {
        // Invalid URL → no initial data
      }
      return undefined;
    },
  });
}
