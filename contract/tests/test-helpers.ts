import * as anchor from "@coral-xyz/anchor";
import { Govcontract } from "../target/types/govcontract";
import { MockGovV1 } from "../target/types/mock_gov_v1";
import { BALLOT_ID, META_MERKLE_ROOT } from "./test-constants";

// Account derivation helpers
export function deriveProposalIndexAccount(program: anchor.Program<Govcontract>): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("index")],
    program.programId
  )[0];
}

export async function waitForNextEpoch(connection: anchor.web3.Connection): Promise<void> {
  const initialEpochInfo = await connection.getEpochInfo();
  const initialEpoch = initialEpochInfo.epoch;
  console.log(`Waiting for epoch to advance from ${initialEpoch}...`);

  while (true) {
    const currentEpochInfo = await connection.getEpochInfo();
    if (currentEpochInfo.epoch > initialEpoch) {
      console.log(`Epoch advanced to ${currentEpochInfo.epoch}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms
  }
}

export function deriveProposalAccount(
  program: anchor.Program<Govcontract>,
  seed: anchor.BN,
  splVoteAccount: anchor.web3.PublicKey
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      seed.toArrayLike(Buffer, "le", 8),
      splVoteAccount.toBuffer(),
    ],
    program.programId
  )[0];
}

export function deriveSupportAccount(
  program: anchor.Program<Govcontract>,
  proposalAccount: anchor.web3.PublicKey,
  splVoteAccount: anchor.web3.PublicKey
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("support"),
      proposalAccount.toBuffer(),
      splVoteAccount.toBuffer(),
    ],
    program.programId
  )[0];
}

export function deriveVoteAccount(
  program: anchor.Program<Govcontract>,
  proposalAccount: anchor.web3.PublicKey,
  splVoteAccount: anchor.web3.PublicKey
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      proposalAccount.toBuffer(),
      splVoteAccount.toBuffer(),
    ],
    program.programId
  )[0];
}

export function deriveConsensusResultAccount(mockProgram: anchor.Program<MockGovV1>): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("ConsensusResult"),
      BALLOT_ID.toArrayLike(Buffer, "le", 8),
    ],
    mockProgram.programId
  )[0];
}

export function deriveMetaMerkleProofAccount(
  mockProgram: anchor.Program<MockGovV1>,
  consensusResult: anchor.web3.PublicKey,
  splVoteAccount: anchor.web3.PublicKey
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MetaMerkleProof"),
      consensusResult.toBuffer(),
      splVoteAccount.toBuffer(),
    ],
    mockProgram.programId
  )[0];
}

export function deriveVoteOverrideAccount(
  program: anchor.Program<Govcontract>,
  proposalAccount: anchor.web3.PublicKey,
  stakeAccount: anchor.web3.PublicKey,
  validatorVote: anchor.web3.PublicKey
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote_override"),
      proposalAccount.toBuffer(),
      stakeAccount.toBuffer(),
      validatorVote.toBuffer(),
    ],
    program.programId
  )[0];
}

type GovEventName = 
  "merkleRootAdded" | 
  "proposalCreated" | 
  "proposalFinalized" | 
  "proposalSupported" | 
  "voteCast" | 
  "voteModified" | 
  "voteOverrideCast";

// Event listener helpers
export function createEventListener(
  program: anchor.Program<Govcontract>,
  eventName: GovEventName,
  callback: (event: any, slot: number) => void
): number {
  return program.addEventListener(eventName, callback);
}

export function removeEventListener(
  program: anchor.Program<Govcontract>,
  listenerId: number
): void {
  program.removeEventListener(listenerId);
}

// Proposal display helper
export function logProposalState(proposal: any, prefix = ""): void {
  if (!proposal) {
    console.log(`${prefix} Proposal State: Account not found or undefined`);
    return;
  }

  console.log(`${prefix} Proposal State:`);
  console.log(`- Cluster support lamports: ${proposal.clusterSupportLamports?.toString()} (${proposal.clusterSupportLamports ? (Number(proposal.clusterSupportLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- For votes lamports: ${proposal.forVotesLamports?.toString()} (${proposal.forVotesLamports ? (Number(proposal.forVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Against votes lamports: ${proposal.againstVotesLamports?.toString()} (${proposal.againstVotesLamports ? (Number(proposal.againstVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Abstain votes lamports: ${proposal.abstainVotesLamports?.toString()} (${proposal.abstainVotesLamports ? (Number(proposal.abstainVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Proposer stake weight bp: ${proposal.proposerStakeWeightBp?.toString()} (${proposal.proposerStakeWeightBp ? (Number(proposal.proposerStakeWeightBp) / 100) : 'undefined'}%)`);
  console.log(`- Meta merkle root: ${proposal.metaMerkleRoot ? Buffer.from(proposal.metaMerkleRoot).toString('hex') : 'None'}`);
  console.log(`- Snapshot slot: ${proposal.snapshotSlot?.toString()}`);
  console.log(`- Voting: ${proposal.voting}`);
  console.log(`- Finalized: ${proposal.finalized}`);
}

// Vote account display helper
export function logVoteState(vote: any, prefix = ""): void {
  if (!vote) {
    console.log(`${prefix} Vote Account State: Account not found or undefined`);
    return;
  }
  console.log(`${prefix} Vote Account State:`);
  console.log(`- For votes bp: ${vote.forVotesBp?.toString()} (${vote.forVotesBp ? (Number(vote.forVotesBp) / 100) : 'undefined'}%)`);
  console.log(`- Against votes bp: ${vote.againstVotesBp?.toString()} (${vote.againstVotesBp ? (Number(vote.againstVotesBp) / 100) : 'undefined'}%)`);
  console.log(`- Abstain votes bp: ${vote.abstainVotesBp?.toString()} (${vote.abstainVotesBp ? (Number(vote.abstainVotesBp) / 100) : 'undefined'}%)`);
  console.log(`- For votes lamports: ${vote.forVotesLamports?.toString()} (${vote.forVotesLamports ? (Number(vote.forVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Against votes lamports: ${vote.againstVotesLamports?.toString()} (${vote.againstVotesLamports ? (Number(vote.againstVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Abstain votes lamports: ${vote.abstainVotesLamports?.toString()} (${vote.abstainVotesLamports ? (Number(vote.abstainVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Override lamports: ${vote.overrideLamports?.toString()} (${vote.overrideLamports ? (Number(vote.overrideLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Total stake: ${vote.stake?.toString()} (${vote.stake ? (Number(vote.stake) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Has voted: ${vote.hasVoted}`);
}

// Vote override account display helper
export function logVoteOverrideState(voteOverride: any, prefix = ""): void {
  if (!voteOverride) {
    console.log(`${prefix} Vote Override Account State: Account not found or undefined`);
    return;
  }
  console.log(`${prefix} Vote Override Account State:`);
  console.log(`- Stake account: ${voteOverride.stakeAccount?.toBase58()}`);
  console.log(`- Validator: ${voteOverride.validator?.toBase58()}`);
  console.log(`- Proposal: ${voteOverride.proposal?.toBase58()}`);
  console.log(`- Vote account validator: ${voteOverride.voteAccountValidator?.toBase58()}`);
  console.log(`- For votes bp: ${voteOverride.forVotesBp?.toString()} (${voteOverride.forVotesBp ? (Number(voteOverride.forVotesBp) / 100) : 'undefined'}%)`);
  console.log(`- Against votes bp: ${voteOverride.againstVotesBp?.toString()} (${voteOverride.againstVotesBp ? (Number(voteOverride.againstVotesBp) / 100) : 'undefined'}%)`);
  console.log(`- Abstain votes bp: ${voteOverride.abstainVotesBp?.toString()} (${voteOverride.abstainVotesBp ? (Number(voteOverride.abstainVotesBp) / 100) : 'undefined'}%)`);
  console.log(`- For votes lamports: ${voteOverride.forVotesLamports?.toString()} (${voteOverride.forVotesLamports ? (Number(voteOverride.forVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Against votes lamports: ${voteOverride.againstVotesLamports?.toString()} (${voteOverride.againstVotesLamports ? (Number(voteOverride.againstVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Abstain votes lamports: ${voteOverride.abstainVotesLamports?.toString()} (${voteOverride.abstainVotesLamports ? (Number(voteOverride.abstainVotesLamports) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Stake amount: ${voteOverride.stakeAmount?.toString()} (${voteOverride.stakeAmount ? (Number(voteOverride.stakeAmount) / anchor.web3.LAMPORTS_PER_SOL) : 'undefined'} SOL)`);
  console.log(`- Vote override timestamp: ${new Date(Number(voteOverride.voteOverrideTimestamp) * 1000).toISOString()}`);
}

// Event logging helpers
export function logProposalCreatedEvent(event: any): void {
  console.log("Proposal Created Event:");
  console.log(`- Proposal ID: ${event.proposalId?.toBase58()}`);
  console.log(`- Author: ${event.author?.toBase58()}`);
  console.log(`- Title: "${event.title}"`);
  console.log(`- Description: "${event.description}"`);
  console.log(`- Start Epoch: ${event.startEpoch?.toString()}`);
  console.log(`- End Epoch: ${event.endEpoch?.toString()}`);
  console.log(`- Snapshot Slot: ${event.snapshotSlot?.toString()}`);
  console.log(`- Creation Timestamp: ${new Date(Number(event.creationTimestamp) * 1000).toISOString()}`);
}

// Event validation helper (inlined in tests now)
