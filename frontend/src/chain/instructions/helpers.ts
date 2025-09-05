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
export function createProgramWithWallet(wallet: any, programId?: PublicKey): Program<Govcontract> {
  const provider = new AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );
  
  // Use provided programId or default from IDL
  const programIdToUse = programId || new PublicKey(idl.address);
  
  return new Program(idl, programIdToUse, provider) as Program<Govcontract>;
}

// API helpers using the solgov.online service
export async function getVoteAccountProof(
  voteAccount: string,
  network: string = 'mainnet',
  slot?: number
): Promise<VoteAccountProofResponse> {
  const baseUrl = 'https://api.solgov.online';
  
  try {
    // Get current slot if not provided
    let currentSlot = slot;
    if (!currentSlot) {
      const metaResponse = await fetch(`${baseUrl}/meta?network=${network}`);
      if (!metaResponse.ok) {
        throw new Error(`Failed to get network metadata: ${metaResponse.statusText}`);
      }
      const metaData = await metaResponse.json();
      currentSlot = metaData.slot;
    }
    
    const url = `${baseUrl}/proof/vote_account/${voteAccount}?network=${network}&slot=${currentSlot}`;
    const response = await fetch(url);
    
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
  network: string = 'mainnet',
  slot?: number
): Promise<StakeAccountProofResponse> {
  const baseUrl = 'https://api.solgov.online';
  
  try {
    // Get current slot if not provided
    let currentSlot = slot;
    if (!currentSlot) {
      const metaResponse = await fetch(`${baseUrl}/meta?network=${network}`);
      if (!metaResponse.ok) {
        throw new Error(`Failed to get network metadata: ${metaResponse.statusText}`);
      }
      const metaData = await metaResponse.json();
      currentSlot = metaData.slot;
    }
    
    const url = `${baseUrl}/proof/stake_account/${stakeAccount}?network=${network}&slot=${currentSlot}`;
    const response = await fetch(url);
    
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
  network: string = 'mainnet',
  slot?: number
): Promise<VoterSummaryResponse> {
  const baseUrl = 'https://api.solgov.online';
  
  try {
    // Get current slot if not provided
    let currentSlot = slot;
    if (!currentSlot) {
      const metaResponse = await fetch(`${baseUrl}/meta?network=${network}`);
      if (!metaResponse.ok) {
        throw new Error(`Failed to get network metadata: ${metaResponse.statusText}`);
      }
      const metaData = await metaResponse.json();
      currentSlot = metaData.slot;
    }
    
    const url = `${baseUrl}/voter/${walletAddress}?network=${network}&slot=${currentSlot}`;
    const response = await fetch(url);
    
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
  proofResponse: VoteAccountProofResponse,
  snapshotProgramId: PublicKey = new PublicKey("gov4qDhw2rBudqwqhyTHXgJEPSaRdNnAZP3vT7BLwgL")
): [PublicKey, PublicKey] {
  // Derive consensus result PDA (this is typically derived from the snapshot slot)
  const [consensusResultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("consensus_result"),
      Buffer.from(proofResponse.snapshot_slot.toString())
    ],
    snapshotProgramId
  );
  
  // Derive meta merkle proof PDA (this is typically derived from the vote account)
  const [metaMerkleProofPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("meta_merkle_proof"),
      new PublicKey(proofResponse.meta_merkle_leaf.vote_account).toBuffer()
    ],
    snapshotProgramId
  );
  
  return [consensusResultPda, metaMerkleProofPda];
}

// Convert merkle proof strings to the format expected by the program
export function convertMerkleProofStrings(proofStrings: string[]): PublicKey[] {
  return proofStrings.map(proof => new PublicKey(proof));
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
