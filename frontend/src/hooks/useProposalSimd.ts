import { useMemo } from "react";

function getFileNameFromGithubUrl(url: string) {
  const regex = /blob\/[^/]+\/(?:.+\/)*([^/]+)$/;
  const match = url.match(regex);
  if (!match) throw new Error("Invalid GitHub proposal URL");
  return match[1];
}

function getSimdCode(fileName: string) {
  const match = fileName.match(/^(\d+)/);
  if (!match) throw new Error("Filename must start with SIMD number");
  return match[1];
}

export function getSimd(githubUrl: string) {
  try {
    const fileName = getFileNameFromGithubUrl(githubUrl);
    return getSimdCode(fileName);
  } catch (e) {
    console.warn("error extracting filename:", e);
    return undefined;
  }
}

export function useProposalSimd(githubUrl: string) {
  return useMemo(() => getSimd(githubUrl), [githubUrl]);
}
