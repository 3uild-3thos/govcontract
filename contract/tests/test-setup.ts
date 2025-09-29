import * as anchor from "@coral-xyz/anchor";
import { Govcontract } from "../target/types/govcontract";
import { MockGovV1 } from "../target/types/mock_gov_v1";

// Use anchor.web3 for all web3 stuff
const {
  Connection,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  StakeProgram,
  VoteProgram,  
  VoteInit,     
} = anchor.web3;

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  BALLOT_ID,
  META_MERKLE_ROOT,
  createTestLeaf,
  createTestProof
} from "./test-constants";
import {
  deriveConsensusResultAccount,
  deriveMetaMerkleProofAccount,
  waitForNextEpoch,
} from "./test-helpers";

export interface TestAccounts {
  splVoteAccounts: anchor.web3.Keypair[];
  proposalIndexAccount: anchor.web3.PublicKey;
  proposalAccount: anchor.web3.PublicKey;
  supportAccount: anchor.web3.PublicKey;
  voteAccounts: anchor.web3.PublicKey[];
  consensusResult: anchor.web3.PublicKey;
  metaMerkleProofs: anchor.web3.PublicKey[];
  // Main delegator for successful vote override tests
  delegator: anchor.web3.Keypair;
  delegatorStakeAccount: anchor.web3.Keypair;
  // Delegator with zero stake for error testing
  zeroStakeDelegator: anchor.web3.Keypair;
  zeroStakeAccount: anchor.web3.Keypair;
  // Delegator for wrong pubkey error testing
  wrongPubkeyDelegator: anchor.web3.Keypair;
  wrongPubkeyStakeAccount: anchor.web3.Keypair;
  // Extra delegator for invalid basis points error testing
  invalidBpDelegator: anchor.web3.Keypair;
  invalidBpStakeAccount: anchor.web3.Keypair;
}

// Create SPL vote accounts
export async function createSPLVoteAccounts(
  provider: anchor.AnchorProvider,
  count: number = 5
): Promise<anchor.web3.Keypair[]> {
  const splVoteAccounts = Array.from({ length: count }, () =>
    anchor.web3.Keypair.generate()
  );

  const space = VoteProgram.space;
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);
  const extraLamports = 1_000_000_000; // 1 SOL

  const batchSize = 2;
  const signatures: string[] = [];

  for (let batchStart = 0; batchStart < splVoteAccounts.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, splVoteAccounts.length);
    const batch = splVoteAccounts.slice(batchStart, batchEnd);

    const instructions = [];
    const signers = [(provider.wallet as NodeWallet).payer];

    for (const account of batch) {
      signers.push(account);

      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: account.publicKey,
        space,
        lamports: lamports + extraLamports,
        programId: VoteProgram.programId,
      });

      const commission = 1;
      const voteInit = new VoteInit(
        provider.publicKey,
        provider.publicKey,
        provider.publicKey,
        commission
      );
      const initializeIx = VoteProgram.initializeAccount({
        votePubkey: account.publicKey,
        nodePubkey: provider.publicKey,
        voteInit,
      });

      instructions.push(createAccountIx, initializeIx);
    }

    const latestBlockhash = await provider.connection.getLatestBlockhash();
    const message = new TransactionMessage({
      payerKey: provider.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);
    transaction.sign(signers);

    const signature = await provider.connection.sendTransaction(transaction);
    await provider.connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, "confirmed");

    signatures.push(signature);
  }

  // Verify all accounts are owned by the Vote program
  for (let i = 0; i < splVoteAccounts.length; i++) {
    const account = splVoteAccounts[i];
    const accountInfo = await provider.connection.getAccountInfo(account.publicKey);
    if (!accountInfo) {
      throw new Error(`SPL Vote account ${i + 1} not found after creation`);
    }
    if (!accountInfo.owner.equals(VoteProgram.programId)) {
      throw new Error(`SPL Vote account ${i + 1} not owned by Vote program`);
    }
    console.log(`SPL Vote Account ${i + 1}: ${account.publicKey.toBase58()}`);
  }

  console.log("All SPL Vote Accounts owned by Vote program!");
  return splVoteAccounts;
}

// Fund SPL vote accounts
export async function fundSPLVoteAccounts(
  provider: anchor.AnchorProvider,
  splVoteAccounts: anchor.web3.Keypair[],
  lamportsToSend: number = 110_000 * LAMPORTS_PER_SOL // 110k SOL
): Promise<void> {
  const transferTransaction = new anchor.web3.Transaction();

  for (const account of splVoteAccounts) {
    transferTransaction.add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: account.publicKey,
        lamports: lamportsToSend,
      })
    );
  }

  const tx = await anchor.web3.sendAndConfirmTransaction(
    provider.connection,
    transferTransaction,
    [(provider.wallet as NodeWallet).payer]
  );

  for (const account of splVoteAccounts) {
    const balance = await provider.connection.getBalance(account.publicKey) / LAMPORTS_PER_SOL;
    console.log(`Vote account ${account.publicKey.toBase58()} balance: ${balance} SOL`);
  }
}

// Create and delegate stake to the first SPL vote account (used for proposal creation)
export async function createAndDelegateStakeToVoteAccounts(
  provider: anchor.AnchorProvider,
  splVoteAccounts: anchor.web3.Keypair[],
  stakeAmountLamports: number = 110_000 * LAMPORTS_PER_SOL, // 110k SOL to ensure 100k+ is delegated
  waitForActivation: boolean = true
): Promise<void> {
  // Only delegate stake to the first vote account (used for proposal creation)
  const voteAccount = splVoteAccounts[0];

  // Create a delegator keypair
  const delegator = anchor.web3.Keypair.generate();

  // Create stake account
  const stakeAccount = anchor.web3.Keypair.generate();
  const stakeAccountSize = StakeProgram.space;
  const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(stakeAccountSize);

  // Airdrop enough SOL to the delegator for stake account creation + stake amount + fees
  const totalNeeded = rentExempt + stakeAmountLamports + (20 * LAMPORTS_PER_SOL); // rent + stake + 20 SOL buffer for fees
  console.log(`Requesting airdrop of ${totalNeeded / LAMPORTS_PER_SOL} SOL to delegator for proposal creation vote account`);
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(delegator.publicKey, totalNeeded)
  );

  // Verify the delegator has enough balance
  const delegatorBalance = await provider.connection.getBalance(delegator.publicKey);
  console.log(`Delegator balance: ${delegatorBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Rent exempt needed: ${rentExempt / LAMPORTS_PER_SOL} SOL`);
  console.log(`Stake amount: ${stakeAmountLamports / LAMPORTS_PER_SOL} SOL`);
  console.log(`Total needed: ${(rentExempt + stakeAmountLamports) / LAMPORTS_PER_SOL} SOL`);
  console.log(`Expected delegated stake (after rent): ${(stakeAmountLamports - rentExempt) / LAMPORTS_PER_SOL} SOL`);

  const createStakeAccountIx = SystemProgram.createAccount({
    fromPubkey: delegator.publicKey,
    newAccountPubkey: stakeAccount.publicKey,
    lamports: rentExempt + stakeAmountLamports,
    space: stakeAccountSize,
    programId: StakeProgram.programId,
  });

  const initializeStakeIx = StakeProgram.initialize({
    stakePubkey: stakeAccount.publicKey,
    authorized: {
      staker: delegator.publicKey,
      withdrawer: delegator.publicKey,
    },
  });

  const stakeTx = new anchor.web3.Transaction().add(createStakeAccountIx, initializeStakeIx);
  await provider.sendAndConfirm(stakeTx, [delegator, stakeAccount]);

  // Check stake account balance after creation
  const stakeAccountBalance = await provider.connection.getBalance(stakeAccount.publicKey);
  console.log(`Stake account balance after creation: ${stakeAccountBalance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Expected delegatable amount: ${(stakeAccountBalance - rentExempt) / LAMPORTS_PER_SOL} SOL`);

  // Delegate stake to the first vote account (used for proposal creation)
  const delegateStakeIx = StakeProgram.delegate({
    stakePubkey: stakeAccount.publicKey,
    authorizedPubkey: delegator.publicKey,
    votePubkey: voteAccount.publicKey,
  });

  const delegateTx = new anchor.web3.Transaction().add(delegateStakeIx as any);
  await provider.sendAndConfirm(delegateTx, [delegator]);

  // Check stake account balance after delegation
  const stakeAccountBalanceAfter = await provider.connection.getBalance(stakeAccount.publicKey);
  console.log(`Stake account balance after delegation: ${stakeAccountBalanceAfter / LAMPORTS_PER_SOL} SOL`);

  if (waitForActivation) {
    // Wait for initial activation
    await waitForNextEpoch(provider.connection);
    // Wait for full warmup to complete
    await waitForNextEpoch(provider.connection);
  }

  console.log(`Attempted to delegate ${stakeAmountLamports / LAMPORTS_PER_SOL} SOL to proposal creation vote account: ${voteAccount.publicKey.toBase58()}`);
  // Log stake account state
  const stakeInfo = await provider.connection.getParsedAccountInfo(stakeAccount.publicKey);
  if (stakeInfo.value) {
    if ('parsed' in stakeInfo.value.data) {
      const parsedData = stakeInfo.value.data.parsed as any;
      const stakeState = parsedData.info.stake;
      console.log("Stake Account State after delegation:", JSON.stringify(stakeState, null, 2));
      console.log(`Delegation stake amount: ${stakeState.delegation.stake / LAMPORTS_PER_SOL} SOL`);
    } else {
      console.log("Stake account data is not parsed (raw Buffer returned):", stakeInfo.value.data);
    }
  } else {
    console.log("Stake account not found after delegation!");
  }

  console.log("Stake delegation completed successfully!");
}

// Create delegator and stake account for vote override tests
export async function createDelegatorAndStakeAccount(
  provider: anchor.AnchorProvider,
  validatorVoteAccount: anchor.web3.PublicKey,
  stakeAmountLamports: number = LAMPORTS_PER_SOL, // 1 SOL stake
  waitForActivation: boolean = true
): Promise<{ delegator: anchor.web3.Keypair; delegatorStakeAccount: anchor.web3.Keypair }> {
  const delegator = anchor.web3.Keypair.generate();
  const delegatorStakeAccount = anchor.web3.Keypair.generate();

  // Airdrop SOL to delegator
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(delegator.publicKey, 2000 * LAMPORTS_PER_SOL)
  );

  const stakeAccountSize = 200;
  const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(stakeAccountSize);

  const createStakeAccountIx = SystemProgram.createAccount({
    fromPubkey: delegator.publicKey,
    newAccountPubkey: delegatorStakeAccount.publicKey,
    lamports: rentExempt + stakeAmountLamports,
    space: stakeAccountSize,
    programId: StakeProgram.programId,
  });

  const initializeStakeIx = StakeProgram.initialize({
    stakePubkey: delegatorStakeAccount.publicKey,
    authorized: {
      staker: delegator.publicKey,
      withdrawer: delegator.publicKey,
    },
  });

  const stakeTx = new anchor.web3.Transaction().add(createStakeAccountIx, initializeStakeIx);
  await provider.sendAndConfirm(stakeTx, [delegator, delegatorStakeAccount]);

  // Delegate stake to the specified validator
  const delegateStakeIx = StakeProgram.delegate({
    stakePubkey: delegatorStakeAccount.publicKey,
    authorizedPubkey: delegator.publicKey,
    votePubkey: validatorVoteAccount,
  });

  const delegateTx = new anchor.web3.Transaction().add(delegateStakeIx as any);
  await provider.sendAndConfirm(delegateTx, [delegator]);

  if (waitForActivation) {
    // Wait for delegation to activate
    await waitForNextEpoch(provider.connection);
    await waitForNextEpoch(provider.connection);
  }

  console.log(`Delegator ${delegator.publicKey.toBase58()} and stake account ${delegatorStakeAccount.publicKey.toBase58()} created and delegated to ${validatorVoteAccount.toBase58()}`);

  return { delegator, delegatorStakeAccount };
}

// Create delegator with zero active stake for error testing
export async function createZeroStakeDelegatorAndStakeAccount(
  provider: anchor.AnchorProvider,
  validatorVoteAccount: anchor.web3.PublicKey,
  waitForActivation: boolean = true
): Promise<{ zeroStakeDelegator: anchor.web3.Keypair; zeroStakeAccount: anchor.web3.Keypair }> {
  const zeroStakeDelegator = anchor.web3.Keypair.generate();
  const zeroStakeAccount = anchor.web3.Keypair.generate();

  // Airdrop SOL to delegator
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(zeroStakeDelegator.publicKey, 2000 * LAMPORTS_PER_SOL)
  );

  const stakeAccountSize = 200;
  const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(stakeAccountSize);

  // Create stake account with rent-exempt (minimum to be valid stake account)
  const createStakeAccountIx = SystemProgram.createAccount({
    fromPubkey: zeroStakeDelegator.publicKey,
    newAccountPubkey: zeroStakeAccount.publicKey,
    lamports: rentExempt, // Rent-exempt
    space: stakeAccountSize,
    programId: StakeProgram.programId,
  });

  const initializeStakeIx = StakeProgram.initialize({
    stakePubkey: zeroStakeAccount.publicKey,
    authorized: {
      staker: zeroStakeDelegator.publicKey,
      withdrawer: zeroStakeDelegator.publicKey,
    },
  });

  const stakeTx = new anchor.web3.Transaction().add(createStakeAccountIx, initializeStakeIx);
  await provider.sendAndConfirm(stakeTx, [zeroStakeDelegator, zeroStakeAccount]);

  // NOTE: We don't delegate this stake account because the test expects it to have 0 active stake
  // The test will create a Merkle leaf with activeStake: 0 to test the validation

  console.log(`Zero stake delegator ${zeroStakeDelegator.publicKey.toBase58()} and stake account ${zeroStakeAccount.publicKey.toBase58()} created (not delegated)`);

  return { zeroStakeDelegator, zeroStakeAccount };
}

// Create delegator for wrong pubkey error testing
export async function createWrongPubkeyDelegatorAndStakeAccount(
  provider: anchor.AnchorProvider,
  validatorVoteAccount: anchor.web3.PublicKey,
  waitForActivation: boolean = true
): Promise<{ wrongPubkeyDelegator: anchor.web3.Keypair; wrongPubkeyStakeAccount: anchor.web3.Keypair }> {
  const wrongPubkeyDelegator = anchor.web3.Keypair.generate();
  const wrongPubkeyStakeAccount = anchor.web3.Keypair.generate();

  // Airdrop SOL to delegator
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(wrongPubkeyDelegator.publicKey, 2000 * LAMPORTS_PER_SOL)
  );

  const stakeAccountSize = 200;
  const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(stakeAccountSize);

  const createStakeAccountIx = SystemProgram.createAccount({
    fromPubkey: wrongPubkeyDelegator.publicKey,
    newAccountPubkey: wrongPubkeyStakeAccount.publicKey,
    lamports: rentExempt + LAMPORTS_PER_SOL,
    space: stakeAccountSize,
    programId: StakeProgram.programId,
  });

  const initializeStakeIx = StakeProgram.initialize({
    stakePubkey: wrongPubkeyStakeAccount.publicKey,
    authorized: {
      staker: wrongPubkeyDelegator.publicKey,
      withdrawer: wrongPubkeyDelegator.publicKey,
    },
  });

  const stakeTx = new anchor.web3.Transaction().add(createStakeAccountIx, initializeStakeIx);
  await provider.sendAndConfirm(stakeTx, [wrongPubkeyDelegator, wrongPubkeyStakeAccount]);

  // Delegate stake to the specified validator
  const delegateStakeIx = StakeProgram.delegate({
    stakePubkey: wrongPubkeyStakeAccount.publicKey,
    authorizedPubkey: wrongPubkeyDelegator.publicKey,
    votePubkey: validatorVoteAccount,
  });

  const delegateTx = new anchor.web3.Transaction().add(delegateStakeIx as any);
  await provider.sendAndConfirm(delegateTx, [wrongPubkeyDelegator]);

  if (waitForActivation) {
    // Wait for delegation to activate
    await waitForNextEpoch(provider.connection);
    await waitForNextEpoch(provider.connection);
  }

  console.log(`Wrong pubkey delegator ${wrongPubkeyDelegator.publicKey.toBase58()} and stake account ${wrongPubkeyStakeAccount.publicKey.toBase58()} created (not delegated)`);

  return { wrongPubkeyDelegator, wrongPubkeyStakeAccount };
}

// Initialize proposal index
export async function initializeProposalIndex(
  program: anchor.Program<Govcontract>,
  proposalIndexAccount: anchor.web3.PublicKey
): Promise<void> {
  const tx = await program.methods
    .initializeIndex()
    .accountsPartial({
      signer: program.provider.publicKey,
      proposalIndex: proposalIndexAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();


  const indexAccount = await program.account.proposalIndex.fetch(proposalIndexAccount);
  console.log("Current Index:", indexAccount.currentIndex.toString());
}

// Create consensus result
export async function createConsensusResult(
  mockProgram: anchor.Program<MockGovV1>,
  consensusResult: anchor.web3.PublicKey
): Promise<void> {
  const snapshotHash = Array.from(anchor.web3.Keypair.generate().publicKey.toBytes());

  const tx1 = await mockProgram.methods
    .createConsensusResult(BALLOT_ID, META_MERKLE_ROOT, snapshotHash)
    .accountsStrict({
      consensusResult,
      payer: mockProgram.provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  const result = await mockProgram.account.consensusResult.fetch(consensusResult);
  console.log("ConsensusResult:", result);
}

// Create meta merkle proofs
export async function createMetaMerkleProofs(
  mockProgram: anchor.Program<MockGovV1>,
  consensusResult: anchor.web3.PublicKey,
  splVoteAccounts: anchor.web3.Keypair[]
): Promise<void> {
  const leaves = splVoteAccounts.map((account, index) =>
    createTestLeaf(mockProgram.provider.publicKey, account.publicKey)
  );
  const proofs = Array.from({ length: splVoteAccounts.length }, () => createTestProof());

  for (let i = 0; i < splVoteAccounts.length; i++) {
    const metaMerkleProof = deriveMetaMerkleProofAccount(
      mockProgram,
      consensusResult,
      splVoteAccounts[i].publicKey
    );

    await mockProgram.methods
      .initMetaMerkleProof(leaves[i], proofs[i])
      .accountsStrict({
        metaMerkleProof,
        consensusResult,
        payer: mockProgram.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  }
}

// Complete test setup
export async function setupTestEnvironment(
  program: anchor.Program<Govcontract>,
  mockProgram: anchor.Program<MockGovV1>,
  seed: anchor.BN
): Promise<TestAccounts> {
  console.log("Setting up test environment...");
  console.log("   - Creating and funding 8 SPL Vote accounts");
  console.log("   - Setting up stake delegations for proposal creation");
  console.log("   - Creating delegator accounts for vote override testing");
  console.log("   - Initializing proposal index and consensus results");
  console.log("   - Setting up Merkle proofs for validator snapshots");
  console.log("   This may take some time...\n");

  const provider = program.provider as anchor.AnchorProvider;

  // Create SPL vote accounts (5 main + 3 for error testing)
  const splVoteAccounts = await createSPLVoteAccounts(provider, 8);

  // Fund accounts
  await fundSPLVoteAccounts(provider, splVoteAccounts);

  // Create and delegate stake to vote accounts (required for proposal creation)
  await createAndDelegateStakeToVoteAccounts(provider, splVoteAccounts, undefined, false);

  // Create delegator and stake accounts for vote override tests (all delegated to validator 3)
  const { delegator, delegatorStakeAccount } = await createDelegatorAndStakeAccount(
    provider,
    splVoteAccounts[4].publicKey, // Delegate to validator 3 (index 4)
    undefined, // default stake amount
    false // Don't wait yet
  );

  const { zeroStakeDelegator, zeroStakeAccount } = await createZeroStakeDelegatorAndStakeAccount(
    provider,
    splVoteAccounts[4].publicKey, // Delegate to validator 3 (index 4)
    false // Don't wait yet
  );

  const { wrongPubkeyDelegator, wrongPubkeyStakeAccount } = await createWrongPubkeyDelegatorAndStakeAccount(
    provider,
    splVoteAccounts[4].publicKey, // Delegate to validator 3 (index 4)
    false // Don't wait yet
  );

  const { delegator: invalidBpDelegator, delegatorStakeAccount: invalidBpStakeAccount } = await createDelegatorAndStakeAccount(
    provider,
    splVoteAccounts[4].publicKey, // Delegate to validator 3 (index 4)
    undefined, // default stake amount
    false // Don't wait yet
  );

  // Note: splVoteAccounts[5], [6], [7] are reserved for error testing

  // Wait once for all delegations to activate
  await waitForNextEpoch(provider.connection);
  await waitForNextEpoch(provider.connection);

  // Derive accounts
  const proposalIndexAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("index")],
    program.programId
  )[0];

  const proposalAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      seed.toArrayLike(Buffer, "le", 8),
      splVoteAccounts[0].publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  const supportAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("support"),
      proposalAccount.toBuffer(),
      splVoteAccounts[1].publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  const voteAccounts = splVoteAccounts.slice(2).map(account =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        proposalAccount.toBuffer(),
        account.publicKey.toBuffer(),
      ],
      program.programId
    )[0]
  );

  const consensusResult = deriveConsensusResultAccount(mockProgram);
  const metaMerkleProofs = splVoteAccounts.map(account =>
    deriveMetaMerkleProofAccount(mockProgram, consensusResult, account.publicKey)
  );

  // Initialize components
  await initializeProposalIndex(program, proposalIndexAccount);
  await createConsensusResult(mockProgram, consensusResult);
  await createMetaMerkleProofs(mockProgram, consensusResult, splVoteAccounts);

  return {
    splVoteAccounts,
    proposalIndexAccount,
    proposalAccount,
    supportAccount,
    voteAccounts,
    consensusResult,
    metaMerkleProofs,
    delegator,
    delegatorStakeAccount,
    zeroStakeDelegator,
    zeroStakeAccount,
    wrongPubkeyDelegator,
    wrongPubkeyStakeAccount,
    invalidBpDelegator,
    invalidBpStakeAccount,
  };
}
