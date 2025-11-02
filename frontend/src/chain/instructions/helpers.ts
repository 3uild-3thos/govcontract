import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import idl from '@/chain/idl/govcontract.json';
import govV1Idl from '@/chain/idl/gov-v1.json';
import {
  VoteAccountProofResponse,
  StakeAccountProofResponse,
  VoterSummaryResponse,
  SNAPSHOT_PROGRAM_ID,
} from './types';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Govcontract, GovV1 } from '../types';
import { RPC_URLS } from '@/contexts/EndpointContext';

// PDA derivation functions (based on test implementation)
export function deriveProposalPda(
  seed: BN,
  signer: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('proposal'),
      seed.toArrayLike(Buffer, 'le', 8),
      signer.toBuffer(),
    ],
    programId
  );
  return pda;
}

export function deriveProposalIndexPda(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('index')],
    programId
  );
  return pda;
}

export function deriveVotePda(
  proposal: PublicKey,
  signer: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), proposal.toBuffer(), signer.toBuffer()],
    programId
  );
  return pda;
}

export function deriveSupportPda(
  proposal: PublicKey,
  signer: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('support'), proposal.toBuffer(), signer.toBuffer()],
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
      Buffer.from('vote_override'),
      proposal.toBuffer(),
      stakeAccount.toBuffer(),
      validatorVote.toBuffer(),
    ],
    programId
  );
  return pda;
}

export function deriveVoteOverrideCachePda(
  proposal: PublicKey,
  vote: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vote_override_cache'),
      proposal.toBuffer(),
      vote.toBuffer(),
    ],
    programId
  );
  return pda;
}

// Create program instance with wallet
export function createProgramWithWallet(
  wallet: AnchorWallet,
  endpoint?: string
) {
  // Use provided endpoint or default to devnet
  const rpcEndpoint = endpoint || RPC_URLS.testnet;
  const connection = new Connection(rpcEndpoint, 'confirmed');

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  const program = new Program(idl, provider) as Program<Govcontract>;

  return program;
}

// Create program instance with wallet
export function createGovV1ProgramWithWallet(
  wallet: AnchorWallet,
  endpoint?: string
) {
  // Use provided endpoint or default to devnet
  const rpcEndpoint = endpoint || RPC_URLS.testnet;
  const connection = new Connection(rpcEndpoint, 'confirmed');

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  const program = new Program(govV1Idl, provider) as Program<GovV1>;

  return program;
}

// Create program instance with dummy wallet (just for data fetching)
export function createProgramWitDummyWallet(endpoint?: string) {
  // Use provided endpoint or default to devnet
  const rpcEndpoint = endpoint || RPC_URLS.testnet;
  const connection = new Connection(rpcEndpoint, 'confirmed');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dummyWallet: any = {
    publicKey: Keypair.generate().publicKey,
    signAllTransactions: async () => {},
    signTransaction: async () => {},
  };

  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
  });

  const program = new Program(idl, provider) as Program<Govcontract>;

  return program;
}

// TODO: PEDRO temporary, until CORS issue with api.solgov.online is fixed
// Helper function to build the API URL (use proxy in browser, direct URL on server)
function buildSolgovUrl(endpoint: string): string {
  // Use Next.js API proxy when running in browser to avoid CORS
  // if (typeof window !== "undefined") {
  //   // Browser: use proxy with path parameter
  //   return `/api/solgov?path=${encodeURIComponent(endpoint)}`;
  // }
  // Server-side: use direct URL
  // return `https://api.solgov.online/${endpoint}`;\
  return `http://84.32.100.123:8000/${endpoint}`;
  // return `/api/solgov?path=${encodeURIComponent(endpoint)}`;
}

// API helpers using the solgov.online service
export async function getVoteAccountProof(
  voteAccount: string,
  network: string = 'testnet',
  slot?: number
): Promise<VoteAccountProofResponse> {
  // Get current slot if not provided
  let currentSlot = slot;
  if (!currentSlot) {
    const metaUrl = buildSolgovUrl(`meta?network=${network}`);
    const metaResponse = await fetch(metaUrl);
    if (!metaResponse.ok) {
      throw new Error(
        `Failed to get network metadata: ${metaResponse.statusText}`
      );
    }
    const metaData = await metaResponse.json();
    currentSlot = metaData.slot;
  }

  const url = buildSolgovUrl(
    `proof/vote_account/${voteAccount}?network=${network}&slot=${currentSlot}`
  );
  console.log('vote account url', url);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get vote account proof: ${response.statusText}`);
  }

  return await response.json();
}

export async function getStakeAccountProof(
  stakeAccount: string,
  network: string = 'mainnet',
  slot?: number
): Promise<StakeAccountProofResponse> {
  // Get current slot if not provided
  let currentSlot = slot;
  if (!currentSlot) {
    const metaUrl = buildSolgovUrl(`meta?network=${network}`);
    const metaResponse = await fetch(metaUrl);
    if (!metaResponse.ok) {
      throw new Error(
        `Failed to get network metadata: ${metaResponse.statusText}`
      );
    }
    const metaData = await metaResponse.json();
    currentSlot = metaData.slot;
  }

  const url = buildSolgovUrl(
    `proof/stake_account/${stakeAccount}?network=${network}&slot=${currentSlot}`
  );
  console.log('stake account url', url);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to get stake account proof: ${response.statusText}`
    );
  }

  return await response.json();
}

export async function getVoterSummary(
  walletAddress: string,
  network: string = 'mainnet',
  slot?: number
): Promise<VoterSummaryResponse> {
  try {
    // Get current slot if not provided
    let currentSlot = slot;
    if (!currentSlot) {
      const metaUrl = buildSolgovUrl(`meta?network=${network}`);
      const metaResponse = await fetch(metaUrl);
      if (!metaResponse.ok) {
        throw new Error(
          `Failed to get network metadata: ${metaResponse.statusText}`
        );
      }
      const metaData = await metaResponse.json();
      currentSlot = metaData.slot;
    }

    const url = buildSolgovUrl(
      `voter/${walletAddress}?network=${network}&slot=${currentSlot}`
    );
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
  snapshotProgramId: PublicKey = SNAPSHOT_PROGRAM_ID,
  ballot_id: number
): [PublicKey, PublicKey] {
  // Derive consensus result PDA (this is typically derived from the snapshot slot)
  const [consensusResultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('ConsensusResult'),
      new BN(ballot_id).toArrayLike(Buffer, 'le', 8),
    ],
    snapshotProgramId
  );

  // Derive meta merkle proof PDA (this is typically derived from the vote account)
  const [metaMerkleProofPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('MetaMerkleProof'),
      consensusResultPda.toBuffer(),
      new PublicKey(proofResponse.meta_merkle_leaf.vote_account).toBuffer(),
    ],
    snapshotProgramId
  );

  return [consensusResultPda, metaMerkleProofPda];
}

// Convert merkle proof strings to the format expected by the program
export function convertMerkleProofStrings(proofStrings: string[]): PublicKey[] {
  return proofStrings.map((proof) => new PublicKey(proof));
}

// Convert stake merkle leaf data to IDL type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  if (cleanHex.length !== 64) {
    // 32 bytes * 2 hex chars per byte
    throw new Error(
      'Merkle root hash must be exactly 32 bytes (64 hex characters)'
    );
  }
  return new Uint8Array(Buffer.from(cleanHex, 'hex'));
}
