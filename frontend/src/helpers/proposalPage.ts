export const PROPOSAL_PK_QUERY_PARAM = "proposalPublicKey";

export const getProposalDetailPagePath = (pubkey: string) =>
  `/proposal?${PROPOSAL_PK_QUERY_PARAM}=${pubkey}`;
