import { useProposalSimd } from "@/hooks";

interface Props {
  githubUrl: string;
}

export const ProposalSimd = ({ githubUrl }: Props) => {
  const simd = useProposalSimd(githubUrl);

  // if link is invalid or some other error, show nothing. user will just see link to github
  // if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--basic-color-gray)] line-clamp-3">
      {simd || "-"}
    </p>
  );
};
