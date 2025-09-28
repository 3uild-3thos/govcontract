export default async function ProposalDetailsPage({
  params,
}: {
  params: Promise<{ simd: string }>;
}) {
  const { simd } = await params;
  return <div>ProposalDetailsPage {simd}</div>;
}
