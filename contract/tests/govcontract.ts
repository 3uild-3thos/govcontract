import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Govcontract } from "../target/types/govcontract";
import { MockGovV1 } from "../target/types/mock_gov_v1";
import { randomBytes } from "crypto";
import {
  Connection,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  StakeProgram,
} from "@solana/web3.js";
import { VoteInit, VoteProgram } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

describe("govcontract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.govcontract as Program<Govcontract>;
  const mockProgram = anchor.workspace.mock_gov_v1 as Program<MockGovV1>;

  const snapshotSlot = new anchor.BN(1000000); // Dummy snapshot slot

  const payer = provider.wallet as NodeWallet;

  const seed = new anchor.BN(randomBytes(8));

  const proposalIndexAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("index")],
    program.programId
  )[0];

  // Create real vote accountas owned by the Vote program
  const splVoteAccount = anchor.web3.Keypair.generate();
  const splVoteAccount2 = anchor.web3.Keypair.generate();
  const splVoteAccount3 = anchor.web3.Keypair.generate();
  const splVoteAccount4 = anchor.web3.Keypair.generate();
  const splVoteAccount5 = anchor.web3.Keypair.generate();

  const proposalAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("proposal"),
      seed.toArrayLike(Buffer, "le", 8),
      splVoteAccount.publicKey.toBuffer(),
    ],
    program.programId
  )[0];
  console.log("\nProposal Account: ", proposalAccount.toBase58());

  const supportAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("support"),
      proposalAccount.toBuffer(),
      splVoteAccount2.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  const voteAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      proposalAccount.toBuffer(),
      splVoteAccount3.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  console.log("\nValidator 1 SPLVote Public Key: ", provider.publicKey.toBase58());
  console.log("Validator 1 Vote Account: ", voteAccount.toBase58());

  const voteAccount2 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      proposalAccount.toBuffer(),
      splVoteAccount4.publicKey.toBuffer(),
    ],
    program.programId
  )[0];
  console.log("\nValidator 2 SPLVote Public Key: ", splVoteAccount4.publicKey.toBase58());
  console.log("Validator 2 Vote Account: ", voteAccount2.toBase58());

  const voteAccount3 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote"),
      proposalAccount.toBuffer(),
      splVoteAccount5.publicKey.toBuffer(),
    ],
    program.programId
  )[0];
  console.log("\nValidator 3 SPLVote Public Key: ", splVoteAccount5.publicKey.toBase58());
  console.log("Validator 3 Vote Account: ", voteAccount3.toBase58());


  // Note: ballotId will be set in the Setup Mock Gov V1 Accounts test
  const ballotId = new anchor.BN(12345);
  const consensusResult = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("ConsensusResult"),
      ballotId.toArrayLike(Buffer, "le", 8),
    ],
    mockProgram.programId
  )[0];
  const metaMerkleProof = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MetaMerkleProof"),
      consensusResult.toBuffer(),
      splVoteAccount.publicKey.toBuffer(),
    ],
    mockProgram.programId
  )[0];
  const metaMerkleProof2 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MetaMerkleProof"),
      consensusResult.toBuffer(),
      splVoteAccount2.publicKey.toBuffer(),
    ],
    mockProgram.programId
  )[0];
  const metaMerkleProof3 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MetaMerkleProof"),
      consensusResult.toBuffer(),
      splVoteAccount3.publicKey.toBuffer(),
    ],
    mockProgram.programId
  )[0];
  const metaMerkleProof4 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MetaMerkleProof"),
      consensusResult.toBuffer(),
      splVoteAccount4.publicKey.toBuffer(),
    ],
    mockProgram.programId
  )[0];
  const metaMerkleProof5 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("MetaMerkleProof"),
      consensusResult.toBuffer(),
      splVoteAccount5.publicKey.toBuffer(),
    ],
    mockProgram.programId
  )[0];

  it("Create SPLVote Accounts!", async () => {
    // Calculate rent-exempt lamports for the vote account space
    const space = VoteProgram.space;  // Official vote account size
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);

    // Add some extra SOL for voting operations
    const extraLamports = 1_000_000_000; // 1 SOL

    // Create SPL vote accounts in batches of 2 to avoid transaction size limits
    const splVoteAccounts = [splVoteAccount, splVoteAccount2, splVoteAccount3, splVoteAccount4, splVoteAccount5];
    const batchSize = 2;
    const signatures: string[] = [];

    console.log("Creating 5 SPL Vote Accounts in batches...");

    // Process accounts in batches
    for (let batchStart = 0; batchStart < splVoteAccounts.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, splVoteAccounts.length);
      const batch = splVoteAccounts.slice(batchStart, batchEnd);

      console.log(`Processing batch: accounts ${batchStart + 1}-${batchEnd}`);

      const instructions = [];
      const signers = [payer.payer];

      // Create instructions for this batch
      for (const account of batch) {
        signers.push(account);

        // Step 1: Create the vote account (allocates space and assigns to VoteProgram)
        const createAccountIx = SystemProgram.createAccount({
          fromPubkey: provider.publicKey,
          newAccountPubkey: account.publicKey,
          space,
          lamports: lamports + extraLamports,
          programId: VoteProgram.programId,
        });

        // Step 2: Initialize the vote account
        const commission = 1;  // 1% commission
        const voteInit = new VoteInit(
          provider.publicKey,  // nodePubkey: Use provider as node identity
          provider.publicKey,  // authorizedVoter: Use provider as authorized voter
          provider.publicKey,  // authorizedWithdrawer: Use provider as authorized withdrawer
          commission
        );
        const initializeIx = VoteProgram.initializeAccount({
          votePubkey: account.publicKey,
          nodePubkey: provider.publicKey,
          voteInit,
        });

        instructions.push(createAccountIx, initializeIx);
      }

      // Build the versioned message with batch instructions
      const latestBlockhash = await provider.connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: provider.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();  // Use V0 for modern compatibility

      // Create and sign the VersionedTransaction
      const transaction = new VersionedTransaction(message);
      transaction.sign(signers);  // Sign with required keypairs for this batch

      // Send the transaction
      const signature = await provider.connection.sendTransaction(transaction);
      await provider.connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, "confirmed");

      signatures.push(signature);
      console.log(`Batch ${Math.floor(batchStart / batchSize) + 1} completed, signature: ${signature}`);
    }

    console.log("All 5 SPL Vote Accounts Created Successfully!");

    // Verify all accounts are owned by the Vote program
    for (let i = 0; i < splVoteAccounts.length; i++) {
      const account = splVoteAccounts[i];
      const accountInfo = await provider.connection.getAccountInfo(account.publicKey);
      if (!accountInfo) {
        throw new Error(`SPL Vote account ${i + 1} not found after creation`);
      }
      if (!accountInfo.owner.equals(VoteProgram.programId)) {
        throw new Error(`SPL Vote account ${i + 1} not owned by Vote program. Owner: ${accountInfo.owner.toBase58()}`);
      }
      console.log(`SPL Vote Account ${i + 1}: ${account.publicKey.toBase58()}`);
    }

    console.log("All SPL Vote Accounts owned by Vote program!");
  });

  it("Initialize Index!", async () => {
    try {
      const tx = await program.methods
        .initializeIndex()
        .accountsPartial({
          signer: provider.publicKey,
          proposalIndex: proposalIndexAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nProposal Index Initialized Successfully!");
      console.log("Your transaction signature", tx);

      // Verify the index was initialized correctly
      const indexAccount = await program.account.proposalIndex.fetch(proposalIndexAccount);
      console.log("Current Index:", indexAccount.currentIndex.toString());
    } catch (error: any) {
      console.log("\nInitialize Index Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }
      throw error;
    }
  });

  it("Fund Dummy Validator SPLVote Accounts!", async () => {
    try {
      const connection = provider.connection;

      const lamportsToSend = 10_000_000;

      const transferTransaction = new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: splVoteAccount.publicKey,
          lamports: lamportsToSend,
        }),
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: splVoteAccount2.publicKey,
          lamports: lamportsToSend,
        }),
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: splVoteAccount3.publicKey,
          lamports: lamportsToSend,
        }),
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: splVoteAccount4.publicKey,
          lamports: lamportsToSend,
        }),
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: splVoteAccount5.publicKey,
          lamports: lamportsToSend,
        }),
      );

      const tx = await anchor.web3.sendAndConfirmTransaction(
        connection,
        transferTransaction,
        [payer.payer]
      );

      console.log("\nDummy Validator SPLVote Accounts Funded Successfully!");
      console.log("Your transaction signature", tx);
    } catch (error: any) {
      console.log("\nFund Dummy Validator SPLVote Accounts Failed!");
      console.log("Error:", error.message);
      throw error;
    }
  });

  it("Create ConsensusResult PDA!", async () => {
    try {
      // Create ConsensusResult using mock program
      const ballotId = new anchor.BN(12345);
      const metaMerkleRoot = Array.from(randomBytes(32));
      const snapshotHash = Array.from(randomBytes(32));

      const tx1 = await mockProgram.methods
        .createConsensusResult(ballotId, metaMerkleRoot, snapshotHash)
        .accounts({
          consensusResult: consensusResult,
          payer: provider.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("ConsensusResult created, signature:", tx1);

      const result = await mockProgram.account.consensusResult.fetch(consensusResult);
      console.log("ConsensusResult:", result);

      console.log("\nConsensusResult Account Created Successfully!");
    } catch (error: any) {
      console.log("\nCreate ConsensusResult Account Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }
      throw error;
    }
  });

  it("Create MetaMerkleProof PDAs!", async () => {
    const leaf = {
      votingWallet: provider.publicKey,
      voteAccount: splVoteAccount.publicKey,
      stakeMerkleRoot: Array.from(randomBytes(32)),
      activeStake: new anchor.BN(100_000 * LAMPORTS_PER_SOL),
    };
    const leaf2 = {
      votingWallet: provider.publicKey,
      voteAccount: splVoteAccount2.publicKey,
      stakeMerkleRoot: Array.from(randomBytes(32)),
      activeStake: new anchor.BN(100_000 * LAMPORTS_PER_SOL),
    };
    const leaf3 = {
      votingWallet: provider.publicKey,
      voteAccount: splVoteAccount3.publicKey,
      stakeMerkleRoot: Array.from(randomBytes(32)),
      activeStake: new anchor.BN(100_000 * LAMPORTS_PER_SOL),
    };
    const leaf4 = {
      votingWallet: provider.publicKey,
      voteAccount: splVoteAccount4.publicKey,
      stakeMerkleRoot: Array.from(randomBytes(32)),
      activeStake: new anchor.BN(100_000 * LAMPORTS_PER_SOL),
    };
    const leaf5 = {
      votingWallet: provider.publicKey,
      voteAccount: splVoteAccount5.publicKey,
      stakeMerkleRoot: Array.from(randomBytes(32)),
      activeStake: new anchor.BN(100_000 * LAMPORTS_PER_SOL),
    };
    const proof = [Array.from(randomBytes(32)), Array.from(randomBytes(32))]; 
    const proof2 = [Array.from(randomBytes(32)), Array.from(randomBytes(32))];
    const proof3 = [Array.from(randomBytes(32)), Array.from(randomBytes(32))];
    const proof4 = [Array.from(randomBytes(32)), Array.from(randomBytes(32))];
    const proof5 = [Array.from(randomBytes(32)), Array.from(randomBytes(32))];

    await mockProgram.methods
      .initMetaMerkleProof(leaf, proof)
      .accounts({
        metaMerkleProof: metaMerkleProof,
        consensusResult: consensusResult,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await mockProgram.methods
      .initMetaMerkleProof(leaf2, proof2)
      .accounts({
        metaMerkleProof: metaMerkleProof2,
        consensusResult: consensusResult,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await mockProgram.methods
      .initMetaMerkleProof(leaf3, proof3)
      .accounts({
        metaMerkleProof: metaMerkleProof3,
        consensusResult: consensusResult,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await mockProgram.methods
      .initMetaMerkleProof(leaf4, proof4)
      .accounts({
        metaMerkleProof: metaMerkleProof4,
        consensusResult: consensusResult,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await mockProgram.methods
      .initMetaMerkleProof(leaf5, proof5)
      .accounts({
        metaMerkleProof: metaMerkleProof5,
        consensusResult: consensusResult,
        payer: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("\nMetaMerkleProof Account Created Successfully!");
  });

  it("Create Proposal!", async () => {
    // Set up event listener before executing the transaction

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot: number = 0;

    const eventListener = program.addEventListener('proposalCreated', (event: any, slot: number) => {
      console.log("ProposalCreated event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Author:", event.author?.toString());
      console.log("- Title:", event.title);
      console.log("- Description:", event.description);
      console.log("- Start Epoch:", event.startEpoch?.toString());
      console.log("- End Epoch:", event.endEpoch?.toString());
      console.log("- Snapshot Slot:", event.snapshotSlot?.toString());
      console.log("- Creation Timestamp:", event.creationTimestamp?.toString());

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      // Now execute the transaction with the listener already active
      const tx = await program.methods
        .createProposal(
          seed,
          "Proposal1",
          "https://github.com/repo/test-proposal",
          new anchor.BN(0),
          new anchor.BN(1)
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: proposalAccount,
          proposalIndex: proposalIndexAccount,
          splVoteAccount: splVoteAccount.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nNew Proposal Successfully Created!");
      console.log("Your transaction signature", tx);

      // Wait a moment for event to be fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if event was received during transaction execution
      if (eventReceived && eventData) {
        console.log("ProposalCreated event captured successfully");

        // Validate event data
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.author?.equals(provider.publicKey), "Author"],
          [eventData.title === "Proposal1", "Title"],
          [eventData.description === "https://github.com/repo/test-proposal", "Description"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);

        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);

        console.log(`Event captured at slot ${eventSlot}`);
      } else {
        console.log("Warning: ProposalCreated event was not received by the listener");

        // Fallback check in transaction logs
        const txDetails = await provider.connection.getTransaction(tx, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });

        const hasEvent = txDetails?.meta?.logMessages?.some(log => log.includes("ProposalCreated"));
        console.log(hasEvent ? "Event found in transaction logs" : "Event not found in transaction logs");
      }

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nCreate Proposal Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error; // Re-throw to fail the test
    }
  });

  it("Support Proposal!", async () => {
    // Set up event listener before executing the transaction

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot: number = 0;

    const eventListener = program.addEventListener('proposalSupported', (event: any, slot: number) => {
      console.log("proposalSupported event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Supporter:", event.supporter?.toString());
      console.log(`- Cluster support lamports: ${event.clusterSupportLamports?.toString()} (${Number(event.clusterSupportLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Voting activated:", event.votingActivated);

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .supportProposal()
        .accountsPartial({
          signer: provider.publicKey,
          proposal: proposalAccount,
          support: supportAccount,
          splVoteAccount: splVoteAccount2.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof: metaMerkleProof2,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nProposal Supported Successfully!");
      console.log("Your transaction signature", tx);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if event was received
      if (eventReceived && eventData) {
        console.log("ProposalSupported event captured successfully");

        // Validate event data
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.supporter?.equals(provider.publicKey), "Supporter"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);

        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);

        console.log(`Event captured at slot ${eventSlot}`);
      } else {
        console.log("Warning: ProposalSupported event was not received by the listener");
      }

      // Fetch and display updated proposal data
      console.log("\nFetching updated proposal data after support...");
      const updatedProposal = await program.account.proposal.fetch(proposalAccount);
      console.log("Updated Proposal State:");
      console.log(`- Cluster support lamports: ${updatedProposal.clusterSupportLamports.toString()} (${Number(updatedProposal.clusterSupportLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Voting active:", updatedProposal.voting);
      console.log(`- For votes lamports: ${updatedProposal.forVotesLamports.toString()} (${Number(updatedProposal.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${updatedProposal.againstVotesLamports.toString()} (${Number(updatedProposal.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${updatedProposal.abstainVotesLamports.toString()} (${Number(updatedProposal.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nSupport Proposal Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error;
    }
  });

  it("Cast Vote for Validator 1!", async () => {
    // Set up event listener for voteCast event

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot: number = 0;

    const eventListener = program.addEventListener('voteCast', (event: any, slot: number) => {
      console.log("voteCast event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Voter:", event.voter?.toString());
      console.log("- Vote Account:", event.voteAccount?.toString());
      console.log(`- For votes BP: ${event.forVotesBp?.toString()} (${Number(event.forVotesBp) / 100}%)`);
      console.log(`- Against votes BP: ${event.againstVotesBp?.toString()} (${Number(event.againstVotesBp) / 100}%)`);
      console.log(`- Abstain votes BP: ${event.abstainVotesBp?.toString()} (${Number(event.abstainVotesBp) / 100}%)`);
      console.log(`- For votes lamports: ${event.forVotesLamports?.toString()} (${Number(event.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${event.againstVotesLamports?.toString()} (${Number(event.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${event.abstainVotesLamports?.toString()} (${Number(event.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Vote timestamp:", event.voteTimestamp?.toString());

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .castVote(
          new anchor.BN(4_000),
          new anchor.BN(4_000),
          new anchor.BN(2_000)
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: proposalAccount,
          vote: voteAccount,
          splVoteAccount: splVoteAccount3.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof: metaMerkleProof3,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nVote Casted Successfully for Validator 1!");
      console.log("Your transaction signature", tx);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if event was received
      if (eventReceived && eventData) {
        console.log("VoteCast event captured successfully");

        // Validate event data
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.voter?.equals(provider.publicKey), "Voter"],
          [eventData.forVotesBp?.toString() === '4000', "For votes BP"],
          [eventData.againstVotesBp?.toString() === '4000', "Against votes BP"],
          [eventData.abstainVotesBp?.toString() === '2000', "Abstain votes BP"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);

        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);

        console.log(`Event captured at slot ${eventSlot}`);
      } else {
        console.log("Warning: VoteCast event was not received by the listener");
      }

      // Fetch and display updated proposal data
      console.log("\nFetching updated proposal data after vote...");
      const updatedProposal = await program.account.proposal.fetch(proposalAccount);
      console.log("Updated Proposal State:");
      console.log(`- For votes lamports: ${updatedProposal.forVotesLamports.toString()} (${Number(updatedProposal.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${updatedProposal.againstVotesLamports.toString()} (${Number(updatedProposal.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${updatedProposal.abstainVotesLamports.toString()} (${Number(updatedProposal.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Total vote count:", updatedProposal.voteCount.toString());
      console.log("- Voting active:", updatedProposal.voting);

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nCast Vote for Validator 1 Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error;
    }
  });

  it("Cast Vote for Validator 2!", async () => {
    // Set up event listener for voteCast event

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot: number = 0;

    const eventListener = program.addEventListener('voteCast', (event: any, slot: number) => {
      console.log("voteCast event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Voter:", event.voter?.toString());
      console.log("- Vote Account:", event.voteAccount?.toString());
      console.log(`- For votes BP: ${event.forVotesBp?.toString()} (${Number(event.forVotesBp) / 100}%)`);
      console.log(`- Against votes BP: ${event.againstVotesBp?.toString()} (${Number(event.againstVotesBp) / 100}%)`);
      console.log(`- Abstain votes BP: ${event.abstainVotesBp?.toString()} (${Number(event.abstainVotesBp) / 100}%)`);
      console.log(`- For votes lamports: ${event.forVotesLamports?.toString()} (${Number(event.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${event.againstVotesLamports?.toString()} (${Number(event.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${event.abstainVotesLamports?.toString()} (${Number(event.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Vote timestamp:", event.voteTimestamp?.toString());

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .castVote(
          new anchor.BN(4_000),
          new anchor.BN(4_000),
          new anchor.BN(2_000)
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: proposalAccount,
          vote: voteAccount2,
          splVoteAccount: splVoteAccount4.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof: metaMerkleProof4,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nVote Casted Successfully for Validator 2!");
      console.log("Your transaction signature", tx);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if event was received
      if (eventReceived && eventData) {
        console.log("VoteCast event captured successfully");

        // Validate event data
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.voter?.equals(provider.publicKey), "Voter"],
          [eventData.forVotesBp?.toString() === '4000', "For votes BP"],
          [eventData.againstVotesBp?.toString() === '4000', "Against votes BP"],
          [eventData.abstainVotesBp?.toString() === '2000', "Abstain votes BP"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);

        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);

        console.log(`Event captured at slot ${eventSlot}`);
      } else {
        console.log("Warning: VoteCast event was not received by the listener");
      }

      // Fetch and display updated proposal data
      console.log("\nFetching updated proposal data after vote...");
      const updatedProposal = await program.account.proposal.fetch(proposalAccount);
      console.log("Updated Proposal State:");
      console.log(`- For votes lamports: ${updatedProposal.forVotesLamports.toString()} (${Number(updatedProposal.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${updatedProposal.againstVotesLamports.toString()} (${Number(updatedProposal.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${updatedProposal.abstainVotesLamports.toString()} (${Number(updatedProposal.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Total vote count:", updatedProposal.voteCount.toString());
      console.log("- Voting active:", updatedProposal.voting);

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nCast Vote for Validator 2 Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error;
    }
  });

  it("Cast Vote for Validator 3!", async () => {
    // Set up event listener for voteCast event

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot: number = 0;

    const eventListener = program.addEventListener('voteCast', (event: any, slot: number) => {
      console.log("voteCast event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Voter:", event.voter?.toString());
      console.log("- Vote Account:", event.voteAccount?.toString());
      console.log(`- For votes BP: ${event.forVotesBp?.toString()} (${Number(event.forVotesBp) / 100}%)`);
      console.log(`- Against votes BP: ${event.againstVotesBp?.toString()} (${Number(event.againstVotesBp) / 100}%)`);
      console.log(`- Abstain votes BP: ${event.abstainVotesBp?.toString()} (${Number(event.abstainVotesBp) / 100}%)`);
      console.log(`- For votes lamports: ${event.forVotesLamports?.toString()} (${Number(event.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${event.againstVotesLamports?.toString()} (${Number(event.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${event.abstainVotesLamports?.toString()} (${Number(event.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Vote timestamp:", event.voteTimestamp?.toString());

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .castVote(
          new anchor.BN(4_000),
          new anchor.BN(4_000),
          new anchor.BN(2_000)
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: proposalAccount,
          vote: voteAccount3,
          splVoteAccount: splVoteAccount5.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof: metaMerkleProof5,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nVote Casted Successfully for Validator 3!");
      console.log("Your transaction signature", tx);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if event was received
      if (eventReceived && eventData) {
        console.log("VoteCast event captured successfully");

        // Validate event data
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.voter?.equals(provider.publicKey), "Voter"],
          [eventData.forVotesBp?.toString() === '4000', "For votes BP"],
          [eventData.againstVotesBp?.toString() === '4000', "Against votes BP"],
          [eventData.abstainVotesBp?.toString() === '2000', "Abstain votes BP"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);

        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);

        console.log(`Event captured at slot ${eventSlot}`);
      } else {
        console.log("Warning: VoteCast event was not received by the listener");
      }

      // Fetch and display updated proposal data
      console.log("\nFetching updated proposal data after vote...");
      const updatedProposal = await program.account.proposal.fetch(proposalAccount);
      console.log("Updated Proposal State:");
      console.log(`- For votes lamports: ${updatedProposal.forVotesLamports.toString()} (${Number(updatedProposal.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${updatedProposal.againstVotesLamports.toString()} (${Number(updatedProposal.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${updatedProposal.abstainVotesLamports.toString()} (${Number(updatedProposal.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Total vote count:", updatedProposal.voteCount.toString());
      console.log("- Voting active:", updatedProposal.voting);

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nCast Vote for Validator 3 Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error;
    }
  });

  it("Modify Vote!", async () => {
    // Set up event listener for voteModified event

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot: number = 0;

    const eventListener = program.addEventListener('voteModified', (event: any, slot: number) => {
      console.log("voteModified event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Voter:", event.voter?.toString());
      console.log("- Vote Account:", event.voteAccount?.toString());
      console.log(`- Old For votes BP: ${event.oldForVotesBp?.toString()} (${Number(event.oldForVotesBp) / 100}%)`);
      console.log(`- Old Against votes BP: ${event.oldAgainstVotesBp?.toString()} (${Number(event.oldAgainstVotesBp) / 100}%)`);
      console.log(`- Old Abstain votes BP: ${event.oldAbstainVotesBp?.toString()} (${Number(event.oldAbstainVotesBp) / 100}%)`);
      console.log(`- New For votes BP: ${event.newForVotesBp?.toString()} (${Number(event.newForVotesBp) / 100}%)`);
      console.log(`- New Against votes BP: ${event.newAgainstVotesBp?.toString()} (${Number(event.newAgainstVotesBp) / 100}%)`);
      console.log(`- New Abstain votes BP: ${event.newAbstainVotesBp?.toString()} (${Number(event.newAbstainVotesBp) / 100}%)`);
      console.log(`- For votes lamports: ${event.forVotesLamports?.toString()} (${Number(event.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${event.againstVotesLamports?.toString()} (${Number(event.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${event.abstainVotesLamports?.toString()} (${Number(event.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Modification timestamp:", event.modificationTimestamp?.toString());

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .modifyVote(
          new anchor.BN(4_000),
          new anchor.BN(2_000),
          new anchor.BN(4_000)
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: proposalAccount,
          vote: voteAccount,
          splVoteAccount: splVoteAccount3.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof: metaMerkleProof3,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("\nVote Modified Successfully!");
      console.log("Your transaction signature", tx);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if event was received
      if (eventReceived && eventData) {
        console.log("VoteModified event captured successfully");

        // Validate event data
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.voter?.equals(provider.publicKey), "Voter"],
          [eventData.newForVotesBp?.toString() === '4000', "New For votes BP"],
          [eventData.newAgainstVotesBp?.toString() === '2000', "New Against votes BP"],
          [eventData.newAbstainVotesBp?.toString() === '4000', "New Abstain votes BP"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);

        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);

        console.log(`Event captured at slot ${eventSlot}`);
      } else {
        console.log("Warning: VoteModified event was not received by the listener");
      }

      // Fetch and display updated proposal data
      console.log("\nFetching updated proposal data after vote modification...");
      const updatedProposal = await program.account.proposal.fetch(proposalAccount);
      console.log("Updated Proposal State:");
      console.log(`- For votes lamports: ${updatedProposal.forVotesLamports.toString()} (${Number(updatedProposal.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${updatedProposal.againstVotesLamports.toString()} (${Number(updatedProposal.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${updatedProposal.abstainVotesLamports.toString()} (${Number(updatedProposal.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Total vote count:", updatedProposal.voteCount.toString());
      console.log("- Voting active:", updatedProposal.voting);

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nModify Vote Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error;
    }
  });

  it("Cast Vote Override!", async () => {
    // Create a delegator keypair to override validator 3's vote
    const delegator = anchor.web3.Keypair.generate();

    // Fund the delegator account
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(delegator.publicKey, 2 * LAMPORTS_PER_SOL)
    );

    // Create a proper stake account for the delegator
    const delegatorStakeAccount = anchor.web3.Keypair.generate();

    // Create stake account owned by the stake program
    const stakeAccountSize = 200; // Size of a stake account
    const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(stakeAccountSize);

    const createStakeAccountIx = SystemProgram.createAccount({
      fromPubkey: delegator.publicKey,
      newAccountPubkey: delegatorStakeAccount.publicKey,
      lamports: rentExempt + LAMPORTS_PER_SOL, // Rent exempt + some lamports
      space: stakeAccountSize,
      programId: StakeProgram.programId,
    });

    // Initialize the stake account
    const initializeStakeIx = StakeProgram.initialize({
      stakePubkey: delegatorStakeAccount.publicKey,
      authorized: {
        staker: delegator.publicKey,
        withdrawer: delegator.publicKey,
      },
    });

    // Create and send transaction for stake account creation and initialization
    await program.provider.sendAndConfirm(
      new Transaction().add(createStakeAccountIx, initializeStakeIx),
      [delegator, delegatorStakeAccount]
    );

    // Delegate the stake to validator 3 (splVoteAccount5)
    console.log("\nDelegating stake to validator 3...");
    console.log("Stake account:", delegatorStakeAccount.publicKey.toString());
    console.log("Validator to delegate to:", splVoteAccount5.publicKey.toString());

    const delegateStakeIx = StakeProgram.delegate({
      stakePubkey: delegatorStakeAccount.publicKey,
      authorizedPubkey: delegator.publicKey,
      votePubkey: splVoteAccount5.publicKey, // Delegate to validator 3
    });

    // Send delegation transaction
    await program.provider.sendAndConfirm(
      new Transaction().add(delegateStakeIx),
      [delegator]
    );
    console.log("Stake delegation completed successfully");

    // Fetch validator 3's vote account before override
    console.log("\nFetching validator 3's vote account before override...");
    const voteBefore = await program.account.vote.fetch(voteAccount3);
    console.log("Vote Account Before Override:");
    console.log(`- For votes lamports: ${voteBefore.forVotesLamports.toString()} (${Number(voteBefore.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
    console.log(`- Against votes lamports: ${voteBefore.againstVotesLamports.toString()} (${Number(voteBefore.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
    console.log(`- Abstain votes lamports: ${voteBefore.abstainVotesLamports.toString()} (${Number(voteBefore.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
    console.log(`- Override lamports: ${voteBefore.overrideLamports.toString()} (${Number(voteBefore.overrideLamports) / LAMPORTS_PER_SOL} SOL)`);
    console.log(`- Total stake: ${voteBefore.stake.toString()} (${Number(voteBefore.stake) / LAMPORTS_PER_SOL} SOL)`);

    // Set up event listener for voteOverrideCast event
    console.log("\nSetting up voteOverrideCast event listener...");

    let eventReceived = false;
    let eventData: any = null;
    let eventSlot = 0;

    const eventListener = program.addEventListener('voteOverrideCast', (event: any, slot: number) => {
      console.log("voteOverrideCast event received");
      console.log("- Event slot:", slot);
      console.log("- Proposal ID:", event.proposalId?.toString());
      console.log("- Delegator:", event.delegator?.toString());
      console.log("- Stake Account:", event.stakeAccount?.toString());
      console.log("- Validator:", event.validator?.toString());
      console.log(`- For votes BP: ${event.forVotesBp?.toString()} (${Number(event.forVotesBp) / 100}%)`);
      console.log(`- Against votes BP: ${event.againstVotesBp?.toString()} (${Number(event.againstVotesBp) / 100}%)`);
      console.log(`- Abstain votes BP: ${event.abstainVotesBp?.toString()} (${Number(event.abstainVotesBp) / 100}%)`);
      console.log(`- For votes lamports: ${event.forVotesLamports?.toString()} (${Number(event.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${event.againstVotesLamports?.toString()} (${Number(event.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${event.abstainVotesLamports?.toString()} (${Number(event.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Stake amount: ${event.stakeAmount?.toString()} (${Number(event.stakeAmount) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Vote timestamp:", event.voteTimestamp?.toString());

      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      // Vote override parameters - delegator votes 70% for, 30% against
      const forVotesBp = new anchor.BN(7000);
      const againstVotesBp = new anchor.BN(3000);
      const abstainVotesBp = new anchor.BN(0);

      // Create StakeMerkleLeaf for the delegator
      const stakeMerkleLeaf = {
        votingWallet: delegator.publicKey,
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(500000000), // 0.5 SOL stake
      };

      // Vote override PDA
      const voteOverrideAccount = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote_override"),
          proposalAccount.toBuffer(),
          delegatorStakeAccount.publicKey.toBuffer(),
          voteAccount3.toBuffer(), // Override validator 3's vote
        ],
        program.programId
      )[0];

      console.log("\nCasting vote override for Validator 3...");
      console.log("Delegator:", delegator.publicKey.toString());
      console.log("Delegator's stake is delegated to:", splVoteAccount5.publicKey.toString());
      console.log("Validator being overridden:", splVoteAccount5.publicKey.toString());
      console.log("Stake account:", delegatorStakeAccount.publicKey.toString());
      console.log("Vote override account:", voteOverrideAccount.toString());

      await program.methods
        .castVoteOverride(forVotesBp, againstVotesBp, abstainVotesBp, [], stakeMerkleLeaf) // Empty stake proof for test
        .accounts({
          signer: delegator.publicKey,
          proposal: proposalAccount,
          validatorVote: voteAccount3, // Validator 3's existing vote
          splVoteAccount: splVoteAccount5.publicKey, // Validator 3's SPL vote account
          voteOverride: voteOverrideAccount,
          splStakeAccount: delegatorStakeAccount.publicKey,
          snapshotProgram: mockProgram.programId,
          consensusResult,
          metaMerkleProof: metaMerkleProof5, // Validator 3's meta merkle proof
          systemProgram: SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      console.log("Vote override cast successfully");

      // Fetch validator 3's vote account after override to show changes
      console.log("\nFetching validator 3's vote account after override...");
      const voteAfter = await program.account.vote.fetch(voteAccount3);
      console.log("Vote Account After Override:");
      console.log(`- For votes lamports: ${voteAfter.forVotesLamports.toString()} (${Number(voteAfter.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${voteAfter.againstVotesLamports.toString()} (${Number(voteAfter.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${voteAfter.abstainVotesLamports.toString()} (${Number(voteAfter.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Override lamports: ${voteAfter.overrideLamports.toString()} (${Number(voteAfter.overrideLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Total stake: ${voteAfter.stake.toString()} (${Number(voteAfter.stake) / LAMPORTS_PER_SOL} SOL)`);

      // Show the changes
      const forVotesChange = Number(voteAfter.forVotesLamports) - Number(voteBefore.forVotesLamports);
      const againstVotesChange = Number(voteAfter.againstVotesLamports) - Number(voteBefore.againstVotesLamports);
      const abstainVotesChange = Number(voteAfter.abstainVotesLamports) - Number(voteBefore.abstainVotesLamports);
      const overrideChange = Number(voteAfter.overrideLamports) - Number(voteBefore.overrideLamports);

      console.log("\nVote Account Changes:");
      console.log(`- For votes lamports change: ${forVotesChange.toString()} (${forVotesChange / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports change: ${againstVotesChange.toString()} (${againstVotesChange / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports change: ${abstainVotesChange.toString()} (${abstainVotesChange / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Override lamports change: ${overrideChange.toString()} (${overrideChange / LAMPORTS_PER_SOL} SOL)`);

      // Wait a bit for event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived) {
        console.log(`Event captured at slot ${eventSlot}`);

        // Event validation
        const checks = [
          [eventData.proposalId?.equals(proposalAccount), "Proposal ID"],
          [eventData.delegator?.equals(delegator.publicKey), "Delegator"],
          [eventData.stakeAccount?.equals(delegatorStakeAccount.publicKey), "Stake Account"],
          [eventData.validator?.equals(splVoteAccount5.publicKey), "Validator"],
          [eventData.forVotesBp?.toString() === '7000', "For votes BP"],
          [eventData.againstVotesBp?.toString() === '3000', "Against votes BP"],
          [eventData.abstainVotesBp?.toString() === '0', "Abstain votes BP"],
          [eventData.stakeAmount?.eq(new anchor.BN(500000000)), "Stake amount"]
        ];

        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      } else {
        console.log("Warning: VoteOverrideCast event was not received by the listener");
      }

      // Fetch and display updated proposal data
      console.log("\nFetching updated proposal data after vote override...");
      const updatedProposal = await program.account.proposal.fetch(proposalAccount);
      console.log("Updated Proposal State:");
      console.log(`- For votes lamports: ${updatedProposal.forVotesLamports.toString()} (${Number(updatedProposal.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${updatedProposal.againstVotesLamports.toString()} (${Number(updatedProposal.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${updatedProposal.abstainVotesLamports.toString()} (${Number(updatedProposal.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log("- Total vote count:", updatedProposal.voteCount.toString());
      console.log("- Voting active:", updatedProposal.voting);

      // Clean up event listener
      program.removeEventListener(eventListener);
    } catch (error: any) {
      console.log("\nCast Vote Override Failed!");
      console.log("Error:", error.message);
      if (error.logs) {
        console.log("Program Logs:");
        error.logs.forEach((log: string) => console.log(log));
      }

      // Show the vote account state before the failed override for reference
      console.log("\nValidator 3's vote account state before failed override:");
      console.log(`- For votes lamports: ${voteBefore.forVotesLamports.toString()} (${Number(voteBefore.forVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${voteBefore.againstVotesLamports.toString()} (${Number(voteBefore.againstVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${voteBefore.abstainVotesLamports.toString()} (${Number(voteBefore.abstainVotesLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Override lamports: ${voteBefore.overrideLamports.toString()} (${Number(voteBefore.overrideLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Total stake: ${voteBefore.stake.toString()} (${Number(voteBefore.stake) / LAMPORTS_PER_SOL} SOL)`);

      // Clean up event listener even on error
      program.removeEventListener(eventListener);

      throw error;
    }
  });
});
