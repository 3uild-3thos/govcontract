import { useProposalSimdDescription } from "@/hooks";

interface Props {
  githubUrl: string;
}

export const ProposalDescription = ({ githubUrl }: Props) => {
  const { data, isLoading } = useProposalSimdDescription(githubUrl);

  if (isLoading) return <p>Loading summary...</p>;

  // if link is invalid or some other error, show nothing. user will just see link to github
  // if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--basic-color-gray)] line-clamp-3">
      {data?.summary}
    </p>
  );
};
