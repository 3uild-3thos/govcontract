import { useSimdProposalDescription } from "@/hooks/useSimdProposalDescription";

interface Props {
  githubUrl: string;
}

export const ProposalDescription = ({ githubUrl }: Props) => {
  const { data, isLoading, isError, error } =
    useSimdProposalDescription(githubUrl);

  if (isLoading) return <p>Loading summary...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--basic-color-gray)] line-clamp-3">
      {data?.summary}
    </p>
  );
};
