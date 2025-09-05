import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Govcontract } from "@/chain/types";
import { connection } from "@/chain/helpers";
import idl from "@/chain/idl/govcontract.json";
import { VoteAccountProofResponse, StakeAccountProofResponse, VoterSummaryResponse } from "./types";

// PDA derivation functions (based on CLI implementation)
export function deriveProposalPda(
  seed: number,
  voteAccount: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      Buffer.from(seed.toString().padStart(8, '0'), 'utf-8'),
      voteAccount.toBuffer(),
    ],
    programId
  );
  return pda;
}

export function deriveProposalIndexPda(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("proposal_index")],
    programId
  );
  return pda;
}

export function deriveVotePda(
  proposal: PublicKey,
  voteAccount: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      proposal.toBuffer(),
      voteAccount.toBuffer(),
    ],
    programId
  );
  return pda;
}

export function deriveSupportPda(
  proposal: PublicKey,
  voteAccount: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("support"),
      proposal.toBuffer(),
      voteAccount.toBuffer(),
    ],
    programId
  );
  return pda;
}

export function deriveVoteOverridePda(
  proposal: PublicKey,
  stakeAccount: PublicKey,
  validatorVote: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote_override"),
      proposal.toBuffer(),
      stakeAccount.toBuffer(),
      validatorVote.toBuffer(),
    ],
    programId
  );
  return pda;
}

// Create program instance with wallet
export function createProgramWithWallet(wallet: any): Program<Govcontract> {
  const provider = new AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );
  return new Program(idl, provider) as Program<Govcontract>;
}

// API helpers (these would need to be implemented based on your backend)
export async function getVoteAccountProof(
  voteAccount: string,
  apiUrl?: string
): Promise<VoteAccountProofResponse> {
  // This is a placeholder - you'll need to implement the actual API call
  // based on your backend service
  const url = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${url}/api/vote-account-proof/${voteAccount}`);
    if (!response.ok) {
      throw new Error(`Failed to get vote account proof: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get vote account proof: ${error}`);
  }
}

export async function getStakeAccountProof(
  stakeAccount: string,
  apiUrl?: string
): Promise<StakeAccountProofResponse> {
  const url = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${url}/api/stake-account-proof/${stakeAccount}`);
    if (!response.ok) {
      throw new Error(`Failed to get stake account proof: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get stake account proof: ${error}`);
  }
}

export async function getVoterSummary(
  walletAddress: string,
  apiUrl?: string
): Promise<VoterSummaryResponse> {
  const url = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${url}/api/voter-summary/${walletAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to get voter summary: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get voter summary: ${error}`);
  }
}

// Generate PDAs from vote proof response
export function generatePdasFromVoteProofResponse(
  proofResponse: VoteAccountProofResponse
): [PublicKey, PublicKey] {
  // This is a placeholder implementation
  // You'll need to implement the actual PDA generation based on the proof response
  // For now, returning dummy PDAs
  const consensusResultPda = new PublicKey("11111111111111111111111111111111");
  const metaMerkleProofPda = new PublicKey("11111111111111111111111111111111");
  
  return [consensusResultPda, metaMerkleProofPda];
}

// Convert merkle proof strings to the format expected by the program
export function convertMerkleProofStrings(proofStrings: string[]): Buffer[] {
  return proofStrings.map(proof => {
    const hex = proof.startsWith('0x') ? proof.slice(2) : proof;
    return Buffer.from(hex, 'hex');
  });
}

// Convert stake merkle leaf data to IDL type
export function convertStakeMerkleLeafDataToIdlType(leafData: any): any {
  // This is a placeholder - you'll need to implement the actual conversion
  // based on your IDL structure
  return leafData;
}

// Validate vote basis points
export function validateVoteBasisPoints(
  forVotes: number,
  againstVotes: number,
  abstainVotes: number
): void {
  const total = forVotes + againstVotes + abstainVotes;
  if (total !== 10000) {
    throw new Error(`Total vote basis points must sum to 10000, got ${total}`);
  }
}

// Convert hex string to byte array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length !== 64) { // 32 bytes * 2 hex chars per byte
    throw new Error('Merkle root hash must be exactly 32 bytes (64 hex characters)');
  }
  return new Uint8Array(Buffer.from(cleanHex, 'hex'));
}
