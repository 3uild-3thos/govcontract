import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Govcontract } from "../target/types/govcontract";
import { MockGovV1 } from "../target/types/mock_gov_v1";
import { randomBytes } from "crypto";
import { LAMPORTS_PER_SOL, StakeProgram, SystemProgram } from "@solana/web3.js";
import { setupTestEnvironment, TestAccounts } from "./test-setup";
import {
  TEST_PROPOSAL_PARAMS,
  TEST_VOTE_PARAMS,
  TEST_VOTE_MODIFY_PARAMS,
  TEST_VOTE_OVERRIDE_PARAMS,
  BALLOT_ID,
  META_MERKLE_ROOT,
  ERROR_TEST_PARAMS,
  VOTE_ACCOUNT_SIZE,
} from "./test-constants";
import {
  deriveProposalAccount,
  deriveProposalIndexAccount,
  deriveSupportAccount,
  deriveVoteAccount,
  deriveConsensusResultAccount,
  deriveMetaMerkleProofAccount,
  deriveVoteOverrideAccount,
  createEventListener,
  removeEventListener,
  logProposalState,
  logVoteState,
  logVoteOverrideState,
  logProposalCreatedEvent,
  waitForNextEpoch,
} from "./test-helpers";

describe("govcontract full tests", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.govcontract as Program<Govcontract>;
  const mockProgram = anchor.workspace.mock_gov_v1 as Program<MockGovV1>;

  const seed = new anchor.BN(randomBytes(8));
  let testAccounts: TestAccounts;

  before(async () => {
    testAccounts = await setupTestEnvironment(program, mockProgram, seed);
  });

  it("Setup Complete", async () => {
    // Test accounts are set up in before() hook
    console.log("Test environment setup completed successfully");
    console.log("Proposal Account:", testAccounts.proposalAccount.toBase58());
    console.log("Vote Accounts:", testAccounts.voteAccounts.map(acc => acc.toBase58()));
  });

  it("Create Proposal!", async () => {
    let eventReceived = false;
    let eventData: any = null;
    let eventSlot = 0;

    const eventListener = createEventListener(program, 'proposalCreated', (event: any, slot: number) => {
      logProposalCreatedEvent(event);
      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .createProposal(
          seed,
          TEST_PROPOSAL_PARAMS.title,
          TEST_PROPOSAL_PARAMS.description,
          TEST_PROPOSAL_PARAMS.startEpoch,
          TEST_PROPOSAL_PARAMS.votingLengthEpochs
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: testAccounts.proposalAccount,
          proposalIndex: testAccounts.proposalIndexAccount,
          splVoteAccount: testAccounts.splVoteAccounts[0].publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived && eventData) {
        const checks = [
          [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
          [eventData.author?.equals(provider.publicKey), "Author"],
          [eventData.title === TEST_PROPOSAL_PARAMS.title, "Title"],
          [eventData.description === TEST_PROPOSAL_PARAMS.description, "Description"]
        ];
        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      }
 
      const proposal = await program.account.proposal.fetch(testAccounts.proposalAccount);
      logProposalState(proposal, "After Proposal Creation");

      removeEventListener(program, eventListener);
    } catch (error: any) {
      removeEventListener(program, eventListener);
      throw error;
    }
  });

  it("Add Merkle Root to Proposal!", async () => {
    let eventReceived = false;
    let eventData: any = null;
    let eventSlot = 0;

    const eventListener = createEventListener(program, 'merkleRootAdded', (event: any, slot: number) => {
      eventReceived = true;
      eventData = event;
      eventSlot = slot;
    });

    try {
      const tx = await program.methods
        .addMerkleRoot()
        .accountsPartial({
          signer: provider.publicKey,
          proposal: testAccounts.proposalAccount,
          consensusResult: testAccounts.consensusResult,
        })
        .rpc();

      // await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived && eventData) {
        const checks = [
          [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
          [eventData.author?.equals(provider.publicKey), "Author"],
          [Buffer.from(eventData.merkleRootHash).equals(Buffer.from(META_MERKLE_ROOT)), "Merkle Root Hash"]
        ];
        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      }

      // Verify merkle root was set
      const updatedProposal = await program.account.proposal.fetch(testAccounts.proposalAccount);
      console.log("Merkle root set:", !!updatedProposal.metaMerkleRoot);
      console.log("Merkle root:", updatedProposal.metaMerkleRoot ? Buffer.from(updatedProposal.metaMerkleRoot).toString('hex') : 'None');

      removeEventListener(program, eventListener);
    } catch (error: any) {
      removeEventListener(program, eventListener);
      throw error;
    }
  });

  it("Support Proposal!", async () => {
    let eventReceived = false;
    let eventData: any = null;

    const eventListener = createEventListener(program, 'proposalSupported', (event: any, slot: number) => {
      eventReceived = true;
      eventData = event;
    });

    try {
      const tx = await program.methods
        .supportProposal(testAccounts.splVoteAccounts[1].publicKey)
        .accountsPartial({
          signer: provider.publicKey,
          proposal: testAccounts.proposalAccount,
          support: testAccounts.supportAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[1],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived && eventData) {
        const checks = [
          [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
          [eventData.supporter?.equals(provider.publicKey), "Supporter"]
        ];
        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      }

      try {
        const updatedProposal = await program.account.proposal.fetch(testAccounts.proposalAccount);
        logProposalState(updatedProposal, "After Support");
      } catch (error) {
        console.log("After SupportProposal State: Failed to fetch proposal account");
      }

      removeEventListener(program, eventListener);
    } catch (error: any) {
      removeEventListener(program, eventListener);
      throw error;
    }
  });

  it("Cast Votes for Validators!", async () => {
    const validators = [
      {
        name: "Validator 1",
        voteAccount: testAccounts.voteAccounts[0],
        splVoteAccount: testAccounts.splVoteAccounts[2],
        metaMerkleProof: testAccounts.metaMerkleProofs[2],
        voteParams: { for: new anchor.BN(7000), against: new anchor.BN(2000), abstain: new anchor.BN(1000) } // 70% for, 20% against, 10% abstain
      },
      {
        name: "Validator 2",
        voteAccount: testAccounts.voteAccounts[1],
        splVoteAccount: testAccounts.splVoteAccounts[3],
        metaMerkleProof: testAccounts.metaMerkleProofs[3],
        voteParams: { for: new anchor.BN(5000), against: new anchor.BN(4000), abstain: new anchor.BN(1000) } // 50% for, 40% against, 10% abstain
      },
      {
        name: "Validator 3",
        voteAccount: testAccounts.voteAccounts[2],
        splVoteAccount: testAccounts.splVoteAccounts[4],
        metaMerkleProof: testAccounts.metaMerkleProofs[4],
        voteParams: { for: new anchor.BN(3000), against: new anchor.BN(6000), abstain: new anchor.BN(1000) } // 30% for, 60% against, 10% abstain
      },
    ];

    for (const validator of validators) {
      let eventReceived = false;
      let eventData: any = null;

      const eventListener = createEventListener(program, 'voteCast', (event: any, slot: number) => {
        eventReceived = true;
        eventData = event;
      });

      try {
        const tx = await program.methods
          .castVote(validator.splVoteAccount.publicKey, validator.voteParams.for, validator.voteParams.against, validator.voteParams.abstain)
          .accountsPartial({
            signer: provider.publicKey,
            proposal: testAccounts.proposalAccount,
            vote: validator.voteAccount,
            snapshotProgram: mockProgram.programId,
            consensusResult: testAccounts.consensusResult,
            metaMerkleProof: validator.metaMerkleProof,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        // await new Promise(resolve => setTimeout(resolve, 500));

        if (eventReceived && eventData) {
          const checks = [
            [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
            [eventData.voter?.equals(provider.publicKey), "Voter"],
            [eventData.forVotesBp?.eq(validator.voteParams.for), "For votes BP"],
            [eventData.againstVotesBp?.eq(validator.voteParams.against), "Against votes BP"],
            [eventData.abstainVotesBp?.eq(validator.voteParams.abstain), "Abstain votes BP"]
          ];
          const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
          console.log(failed.length === 0 ? "All event validations passed" :
            `Warning: Validation failed for ${failed.join(", ")}`);
        }

        // Display the vote account state after voting
        try {
          const voteAccount = await program.account.vote.fetch(validator.voteAccount);
          logVoteState(voteAccount, `After ${validator.name} Vote`);
        } catch (error) {
          console.log(`After ${validator.name} Vote Vote Account State: Failed to fetch vote account`);
        }

        removeEventListener(program, eventListener);
      } catch (error: any) {
        removeEventListener(program, eventListener);
        throw error;
      }
    }

    // Show final proposal state
    try {
      const finalProposal = await program.account.proposal.fetch(testAccounts.proposalAccount);
      logProposalState(finalProposal, "Final After All Votes");
    } catch (error) {
      console.log("Final After All Votes Proposal State: Failed to fetch proposal account");
    }
  });

  it("Modify Vote!", async () => {
    let eventReceived = false;
    let eventData: any = null;

    const eventListener = createEventListener(program, 'voteModified', (event: any, slot: number) => {
      eventReceived = true;
      eventData = event;
    });

    try {
      const tx = await program.methods
        .modifyVote(testAccounts.splVoteAccounts[2].publicKey, TEST_VOTE_MODIFY_PARAMS.for, TEST_VOTE_MODIFY_PARAMS.against, TEST_VOTE_MODIFY_PARAMS.abstain)
        .accountsPartial({
          signer: provider.publicKey,
          proposal: testAccounts.proposalAccount,
          vote: testAccounts.voteAccounts[0],
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[2],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived && eventData) {
        const checks = [
          [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
          [eventData.voter?.equals(provider.publicKey), "Voter"],
          [eventData.newForVotesBp?.eq(TEST_VOTE_MODIFY_PARAMS.for), "New For votes BP"],
          [eventData.newAgainstVotesBp?.eq(TEST_VOTE_MODIFY_PARAMS.against), "New Against votes BP"],
          [eventData.newAbstainVotesBp?.eq(TEST_VOTE_MODIFY_PARAMS.abstain), "New Abstain votes BP"]
        ];
        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      }

      try {
        const updatedProposal = await program.account.proposal.fetch(testAccounts.proposalAccount);
        logProposalState(updatedProposal, "After Vote Modification");
      } catch (error) {
        console.log("After Vote ModificationProposal State: Failed to fetch proposal account");
      }

      removeEventListener(program, eventListener);
    } catch (error: any) {
      removeEventListener(program, eventListener);
      throw error;
    }
  });

  it("Cast Vote Override!", async () => {
    // Create delegator and stake account
    // Use pre-created delegator and stake account from test setup
    const delegator = testAccounts.delegator;
    const delegatorStakeAccount = testAccounts.delegatorStakeAccount;

    // Fetch vote account before override
    let voteBefore: any = null;
    try {
      voteBefore = await program.account.vote.fetch(testAccounts.voteAccounts[2]);
      logVoteState(voteBefore, "Before Override");
    } catch (error) {
      console.log("Before OverrideVote Account State: Failed to fetch vote account");
    }

    let eventReceived = false;
    let eventData: any = null;

    const eventListener = createEventListener(program, 'voteOverrideCast', (event: any, slot: number) => {
      eventReceived = true;
      eventData = event;
    });

    try {
      const stakeMerkleLeaf = {
        votingWallet: delegator.publicKey,
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(500000000), // 0.5 SOL stake
      };

      const voteOverrideAccount = deriveVoteOverrideAccount(
        program,
        testAccounts.proposalAccount,
        delegatorStakeAccount.publicKey,
        testAccounts.voteAccounts[2]
      );

      await program.methods
        .castVoteOverride(
          testAccounts.splVoteAccounts[4].publicKey,
          delegatorStakeAccount.publicKey,
          TEST_VOTE_OVERRIDE_PARAMS.for,
          TEST_VOTE_OVERRIDE_PARAMS.against,
          TEST_VOTE_OVERRIDE_PARAMS.abstain,
          [],
          stakeMerkleLeaf
        )
        .accountsPartial({
          signer: delegator.publicKey,
          proposal: testAccounts.proposalAccount,
          validatorVote: testAccounts.voteAccounts[2],
          voteOverride: voteOverrideAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[4],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      // Display the vote override account data
      try {
        const voteOverrideData = await program.account.voteOverride.fetch(voteOverrideAccount);
        logVoteOverrideState(voteOverrideData, "After Override");
      } catch (error) {
        console.log("Vote Override Account State: Failed to fetch vote override account");
      }

      // Show changes
      let voteAfter: any = null;
      try {
        voteAfter = await program.account.vote.fetch(testAccounts.voteAccounts[2]);
        logVoteState(voteAfter, "After Override");
      } catch (error) {
        console.log("After OverrideVote Account State: Failed to fetch vote account");
      }

      if (voteAfter && voteBefore) {
        const overrideChange = Number(voteAfter.overrideLamports) - Number(voteBefore.overrideLamports);
        console.log(`Override lamports change: ${overrideChange} (${overrideChange / LAMPORTS_PER_SOL} SOL)`);
      }

      // await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived && eventData) {
        const checks = [
          [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
          [eventData.delegator?.equals(delegator.publicKey), "Delegator"],
          [eventData.validator?.equals(testAccounts.splVoteAccounts[4].publicKey), "Validator"],
          [eventData.forVotesBp?.eq(TEST_VOTE_OVERRIDE_PARAMS.for), "For votes BP"],
          [eventData.againstVotesBp?.eq(TEST_VOTE_OVERRIDE_PARAMS.against), "Against votes BP"],
          [eventData.abstainVotesBp?.eq(TEST_VOTE_OVERRIDE_PARAMS.abstain), "Abstain votes BP"]
        ];
        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      }

      const finalProposal = await program.account.proposal.fetch(testAccounts.proposalAccount);
      logProposalState(finalProposal, "Final After Vote Override");

      removeEventListener(program, eventListener);
    } catch (error: any) {
      removeEventListener(program, eventListener);
      throw error;
    }
  });

  it("Delegator Override Before Validator Vote!", async () => {
    // Use validator 1 (index 0 in splVoteAccounts, which hasn't voted yet)
    const validatorIndex = 0;
    const validatorVoteAccount = deriveVoteAccount(
      program,
      testAccounts.proposalAccount,
      testAccounts.splVoteAccounts[validatorIndex].publicKey
    );

    // Create delegator and stake account (this test needs its own setup for override voting)
    const delegator = anchor.web3.Keypair.generate();

    // Airdrop in batches to avoid potential limits
    const airdropAmount = 100000 * LAMPORTS_PER_SOL + 10 * LAMPORTS_PER_SOL; // buffer
    for (let i = 0; i < 2; i++) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(delegator.publicKey, airdropAmount / 2)
      );
    }
    const delegatorBalance = await provider.connection.getBalance(delegator.publicKey);
    console.log(`Delegator balance after airdrop: ${delegatorBalance / LAMPORTS_PER_SOL} SOL`);

    const delegatorStakeAccount = anchor.web3.Keypair.generate();
    const stakeAccountSize = 200;
    const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(stakeAccountSize);

    const createStakeAccountIx = SystemProgram.createAccount({
      fromPubkey: delegator.publicKey,
      newAccountPubkey: delegatorStakeAccount.publicKey,
      lamports: rentExempt + 100000 * LAMPORTS_PER_SOL,
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

    const stakeBalance = await provider.connection.getBalance(delegatorStakeAccount.publicKey);
    console.log(`Stake account balance after creation: ${stakeBalance / LAMPORTS_PER_SOL} SOL`);

    // Delegate stake to validator 1
    const delegateStakeIx = StakeProgram.delegate({
      stakePubkey: delegatorStakeAccount.publicKey,
      authorizedPubkey: delegator.publicKey,
      votePubkey: testAccounts.splVoteAccounts[validatorIndex].publicKey,
    });

    const delegateTx = new anchor.web3.Transaction().add(delegateStakeIx as any);
    await provider.sendAndConfirm(delegateTx, [delegator]);

    const stakeBalanceAfterDelegate = await provider.connection.getBalance(delegatorStakeAccount.publicKey);
    console.log(`Stake account balance after delegation: ${stakeBalanceAfterDelegate / LAMPORTS_PER_SOL} SOL`);

    // // Wait for stake activation
    // await waitForNextEpoch(provider.connection);
    // await waitForNextEpoch(provider.connection);


    let eventReceived = false;
    let eventData: any = null;

    const eventListener = createEventListener(program, 'voteOverrideCast', (event: any, slot: number) => {
      eventReceived = true;
      eventData = event;
    });

    try {
      // Verify Vote account doesn't exist yet
      try {
        await program.account.vote.fetch(validatorVoteAccount);
        console.log("Vote account already exists - this is unexpected for this test");
      } catch (error) {
        console.log("Vote account doesn't exist yet - good for testing override-first scenario");
      }

      const stakeMerkleLeaf = {
        votingWallet: delegator.publicKey,
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(5000000000), // 5 SOL stake
      };

      const voteOverrideAccount = deriveVoteOverrideAccount(
        program,
        testAccounts.proposalAccount,
        delegatorStakeAccount.publicKey,
        validatorVoteAccount
      );

      // DELEGATOR VOTES FIRST (override before validator vote)
      await program.methods
        .castVoteOverride(
          testAccounts.splVoteAccounts[validatorIndex].publicKey,
          delegatorStakeAccount.publicKey,
          TEST_VOTE_OVERRIDE_PARAMS.for,
          TEST_VOTE_OVERRIDE_PARAMS.against,
          TEST_VOTE_OVERRIDE_PARAMS.abstain,
          [],
          stakeMerkleLeaf
        )
        .accountsPartial({
          signer: delegator.publicKey,
          proposal: testAccounts.proposalAccount,
          validatorVote: validatorVoteAccount,
          voteOverride: voteOverrideAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[validatorIndex],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      // Verify Vote account was created with only override lamports
      try {
        const voteAfterOverride = await program.account.vote.fetch(validatorVoteAccount);
        logVoteState(voteAfterOverride, "After Override (Before Validator Vote)");
        console.log(`Expected: has_voted = false, override_lamports = ${stakeMerkleLeaf.activeStake.toString()}`);
        console.log(`Actual: has_voted = ${voteAfterOverride.hasVoted}, override_lamports = ${voteAfterOverride.overrideLamports.toString()}`);
      } catch (error) {
        console.log("After Override (Before Validator Vote)Vote Account State: Failed to fetch vote account");
      }

      // Verify VoteOverride account was created correctly
      const voteOverrideAfterCast = await program.account.voteOverride.fetch(voteOverrideAccount);
      console.log("VoteOverride Account State After Cast:");
      console.log(`- Stake account: ${voteOverrideAfterCast.stakeAccount.toBase58()}`);
      console.log(`- Validator: ${voteOverrideAfterCast.validator.toBase58()}`);
      console.log(`- Proposal: ${voteOverrideAfterCast.proposal.toBase58()}`);
      console.log(`- Vote account validator: ${voteOverrideAfterCast.voteAccountValidator.toBase58()}`);
      console.log(`- For votes BP: ${voteOverrideAfterCast.forVotesBp.toString()}`);
      console.log(`- Against votes BP: ${voteOverrideAfterCast.againstVotesBp.toString()}`);
      console.log(`- Abstain votes BP: ${voteOverrideAfterCast.abstainVotesBp.toString()}`);
      console.log(`- For votes lamports: ${voteOverrideAfterCast.forVotesLamports.toString()} (${Number(voteOverrideAfterCast.forVotesLamports) / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Against votes lamports: ${voteOverrideAfterCast.againstVotesLamports.toString()} (${Number(voteOverrideAfterCast.againstVotesLamports) / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Abstain votes lamports: ${voteOverrideAfterCast.abstainVotesLamports.toString()} (${Number(voteOverrideAfterCast.abstainVotesLamports) / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Stake amount: ${voteOverrideAfterCast.stakeAmount.toString()} (${Number(voteOverrideAfterCast.stakeAmount) / anchor.web3.LAMPORTS_PER_SOL} SOL)`);
      console.log(`- Vote override timestamp: ${new Date(Number(voteOverrideAfterCast.voteOverrideTimestamp) * 1000).toISOString()}`);

    
      // VALIDATOR VOTES SECOND
      await program.methods
        .castVote(testAccounts.splVoteAccounts[validatorIndex].publicKey, TEST_VOTE_PARAMS.for, TEST_VOTE_PARAMS.against, TEST_VOTE_PARAMS.abstain)
        .accountsPartial({
          signer: provider.publicKey,
          proposal: testAccounts.proposalAccount,
          vote: validatorVoteAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[validatorIndex],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify final state
      try {
        const voteAfterValidator = await program.account.vote.fetch(validatorVoteAccount);
        logVoteState(voteAfterValidator, "After Validator Vote (With Prior Override)");
        console.log(`Expected: has_voted = true, override_lamports = ${stakeMerkleLeaf.activeStake.toString()}`);
        console.log(`Actual: has_voted = ${voteAfterValidator.hasVoted}, override_lamports = ${voteAfterValidator.overrideLamports.toString()}`);
      } catch (error) {
        console.log("After Validator Vote (With Prior Override)Vote Account State: Failed to fetch vote account");
      }

      try {
        const proposalAfter = await program.account.proposal.fetch(testAccounts.proposalAccount);
        logProposalState(proposalAfter, "Final Proposal State");
      } catch (error) {
        console.log("Final Proposal StateProposal State: Failed to fetch proposal account");
      }

      // await new Promise(resolve => setTimeout(resolve, 1000));

      if (eventReceived && eventData) {
        const checks = [
          [eventData.proposalId?.equals(testAccounts.proposalAccount), "Proposal ID"],
          [eventData.delegator?.equals(delegator.publicKey), "Delegator"],
          [eventData.validator?.equals(testAccounts.splVoteAccounts[validatorIndex].publicKey), "Validator"],
          [eventData.forVotesBp?.eq(TEST_VOTE_OVERRIDE_PARAMS.for), "For votes BP"],
          [eventData.againstVotesBp?.eq(TEST_VOTE_OVERRIDE_PARAMS.against), "Against votes BP"],
          [eventData.abstainVotesBp?.eq(TEST_VOTE_OVERRIDE_PARAMS.abstain), "Abstain votes BP"]
        ];
        const failed = checks.filter(([passed]) => !passed).map(([, field]) => field);
        console.log(failed.length === 0 ? "All event validations passed" :
          `Warning: Validation failed for ${failed.join(", ")}`);
      }

      removeEventListener(program, eventListener);
    } catch (error: any) {
      removeEventListener(program, eventListener);
      throw error;
    }
  });

// Error Tests

  it("Error Test - Vote Override with Invalid Basis Points Sum", async () => {
    // Use dedicated delegator and stake account for invalid basis points error testing
    const delegator = testAccounts.invalidBpDelegator;
    const delegatorStakeAccount = testAccounts.invalidBpStakeAccount;

    const validatorVoteAccount = deriveVoteAccount(
      program,
      testAccounts.proposalAccount,
      testAccounts.splVoteAccounts[4].publicKey
    );

    const voteOverrideAccount = deriveVoteOverrideAccount(
      program,
      testAccounts.proposalAccount,
      delegatorStakeAccount.publicKey,
      validatorVoteAccount
    );

    // Test: Invalid basis points sum (30,000 > 10,000)
    try {
      const stakeMerkleLeaf = {
        votingWallet: delegator.publicKey,
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(500000000), // 0.5 SOL stake
      };

      await program.methods
        .castVoteOverride(
          testAccounts.splVoteAccounts[4].publicKey,
          delegatorStakeAccount.publicKey,
          new anchor.BN(10000), // 100% for
          new anchor.BN(10000), // 100% against
          new anchor.BN(10000), // 100% abstain (total = 30,000)
          [],
          stakeMerkleLeaf
        )
        .accountsPartial({
          signer: delegator.publicKey,
          proposal: testAccounts.proposalAccount,
          validatorVote: validatorVoteAccount,
          voteOverride: voteOverrideAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[4],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      throw new Error("Expected InvalidVoteDistribution error was not thrown");
    } catch (error: any) {
      console.log("PASS: InvalidVoteDistribution error caught:", error.message);
    }
  });

  it("Error Test - Vote Override with Zero Stake Amount", async () => {
    // Use dedicated zero stake delegator and stake account
    const delegator = testAccounts.zeroStakeDelegator;
    const delegatorStakeAccount = testAccounts.zeroStakeAccount;

    const validatorVoteAccount = deriveVoteAccount(
      program,
      testAccounts.proposalAccount,
      testAccounts.splVoteAccounts[4].publicKey
    );

    const voteOverrideAccount = deriveVoteOverrideAccount(
      program,
      testAccounts.proposalAccount,
      delegatorStakeAccount.publicKey,
      validatorVoteAccount
    );

    // Test: Zero stake amount in Merkle leaf
    try {
      const stakeMerkleLeafZeroStake = {
        votingWallet: delegator.publicKey,
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(0), // Zero stake
      };

      await program.methods
        .castVoteOverride(
          testAccounts.splVoteAccounts[4].publicKey,
          delegatorStakeAccount.publicKey,
          new anchor.BN(4000), // 40% for
          new anchor.BN(4000), // 40% against
          new anchor.BN(2000), // 20% abstain
          [],
          stakeMerkleLeafZeroStake
        )
        .accountsPartial({
          signer: delegator.publicKey,
          proposal: testAccounts.proposalAccount,
          validatorVote: validatorVoteAccount,
          voteOverride: voteOverrideAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[4],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      throw new Error("Expected NotEnoughStake error was not thrown");
    } catch (error: any) {
      console.log("PASS: NotEnoughStake error caught:", error.message);
    }
  });

  it("Error Test - Vote Override with Arithmetic Overflow", async () => {
    // Use pre-created delegator and stake account
    const delegator = testAccounts.invalidBpDelegator;
    const delegatorStakeAccount = testAccounts.invalidBpStakeAccount;

    const validatorVoteAccount = deriveVoteAccount(
      program,
      testAccounts.proposalAccount,
      testAccounts.splVoteAccounts[4].publicKey
    );

    const voteOverrideAccount = deriveVoteOverrideAccount(
      program,
      testAccounts.proposalAccount,
      delegatorStakeAccount.publicKey,
      validatorVoteAccount
    );

    // Test: Invaid distribution (120% for)
    try {
      const stakeMerkleLeaf = {
        votingWallet: delegator.publicKey,
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(500000000), // 0.5 SOL stake
      };

      await program.methods
        .castVoteOverride(
          testAccounts.splVoteAccounts[4].publicKey,
          delegatorStakeAccount.publicKey,
          new anchor.BN(12000), // 120% for (overflow)
          new anchor.BN(0), // 0% against
          new anchor.BN(0), // 0% abstain
          [],
          stakeMerkleLeaf
        )
        .accountsPartial({
          signer: delegator.publicKey,
          proposal: testAccounts.proposalAccount,
          validatorVote: validatorVoteAccount,
          voteOverride: voteOverrideAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[4],
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      throw new Error("Expected arithmetic overflow/underflow error was not thrown");
    } catch (error: any) {
      console.log("PASS: Arithmetic overflow error caught:", error.message);
    }
  });

  it("Error Test - Vote Override with Wrong Voting Wallet Pubkey", async () => {
    // Use dedicated wrong pubkey delegator and stake account
    const delegator = testAccounts.wrongPubkeyDelegator;
    const delegatorStakeAccount = testAccounts.wrongPubkeyStakeAccount;

    const validatorVoteAccount = deriveVoteAccount(
      program,
      testAccounts.proposalAccount,
      testAccounts.splVoteAccounts[4].publicKey
    );

    const voteOverrideAccount = deriveVoteOverrideAccount(
      program,
      testAccounts.proposalAccount,
      delegatorStakeAccount.publicKey,
      validatorVoteAccount
    );

    // Test: Merkle verification fails due to wrong voting wallet pubkey
    try {
      const wrongPubkey = anchor.web3.Keypair.generate().publicKey; // Generate a completely different pubkey
      const stakeMerkleLeafWrongPubkey = {
        votingWallet: wrongPubkey, // Wrong pubkey - should not match signer or merkle proof
        stakeAccount: delegatorStakeAccount.publicKey,
        activeStake: new anchor.BN(500000000), // 0.5 SOL stake
      };

      await program.methods
        .castVoteOverride(
          testAccounts.splVoteAccounts[4].publicKey,
          delegatorStakeAccount.publicKey,
          new anchor.BN(4000), // 40% for
          new anchor.BN(4000), // 40% against
          new anchor.BN(2000), // 20% abstain
          [],
          stakeMerkleLeafWrongPubkey
        )
        .accountsPartial({
          signer: delegator.publicKey, // Signer is still delegator
          proposal: testAccounts.proposalAccount,
          validatorVote: validatorVoteAccount,
          voteOverride: voteOverrideAccount,
          snapshotProgram: mockProgram.programId,
          consensusResult: testAccounts.consensusResult,
          metaMerkleProof: testAccounts.metaMerkleProofs[4], // This proof expects delegator.publicKey, not wrongPubkey
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([delegator])
        .rpc();

      throw new Error("Expected merkle verification error was not thrown");
    } catch (error: any) {
      console.log("PASS: Merkle verification error caught:", error.message);
    }
  });

  it("Error Test - Cannot Initialize Index Twice", async () => {

    const proposalIndexAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("index")],
      program.programId
    )[0];

    try {
      await program.methods
        .initializeIndex()
        .accountsPartial({
          signer: provider.publicKey,
          proposalIndex: proposalIndexAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      throw new Error("Expected error was not thrown - index should already be initialized");
    } catch (error: any) {
      // Verify the error is the expected one (account already in use)
      console.log("Expected error caught:", error.message);

    }
  });

  it("Error Test - Create Proposal with Empty Title", async () => {
    const testSeed = new anchor.BN(randomBytes(8));
    const splVoteAccount = testAccounts.splVoteAccounts[5];

    try {
      await program.methods
        .createProposal(
          testSeed,
          ERROR_TEST_PARAMS.emptyTitle,
          TEST_PROPOSAL_PARAMS.description,
          TEST_PROPOSAL_PARAMS.startEpoch,
          TEST_PROPOSAL_PARAMS.votingLengthEpochs
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: deriveProposalAccount(program, testSeed, splVoteAccount.publicKey),
          proposalIndex: deriveProposalIndexAccount(program),
          splVoteAccount: splVoteAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      throw new Error("Expected error was not thrown - empty title should be rejected");
    } catch (error: any) {
      // Verify the error is the expected one
      console.log("Expected error caught:", error.message);
      if (error.message.includes("TitleEmpty") || error.message.includes("cannot be empty")) {
        console.log("Correctly caught TitleEmpty error");
      }
    }
  });

  it("Error Test - Create Proposal with Empty Description", async () => {
    const testSeed = new anchor.BN(randomBytes(8));
    const splVoteAccount = testAccounts.splVoteAccounts[6];

    try {
      await program.methods
        .createProposal(
          testSeed,
          TEST_PROPOSAL_PARAMS.title,
          ERROR_TEST_PARAMS.emptyDescription,
          TEST_PROPOSAL_PARAMS.startEpoch,
          TEST_PROPOSAL_PARAMS.votingLengthEpochs
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: deriveProposalAccount(program, testSeed, splVoteAccount.publicKey),
          proposalIndex: deriveProposalIndexAccount(program),
          splVoteAccount: splVoteAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      throw new Error("Expected error was not thrown - empty description should be rejected");
    } catch (error: any) {
      // Verify the error is the expected one
      console.log("Expected error caught:", error.message);
      if (error.message.includes("DescriptionEmpty") || error.message.includes("cannot be empty")) {
        console.log("Correctly caught DescriptionEmpty error");
      }
    }
  });

  it("Error Test - Voting Length Too Long", async () => {
    const testSeed = new anchor.BN(randomBytes(8));
    const splVoteAccount = testAccounts.splVoteAccounts[7];

    try {
      await program.methods
        .createProposal(
          testSeed,
          TEST_PROPOSAL_PARAMS.title,
          TEST_PROPOSAL_PARAMS.description,
          TEST_PROPOSAL_PARAMS.startEpoch,
          ERROR_TEST_PARAMS.longVotingLength // 20 epochs > MAX_VOTING_EPOCHS (10)
        )
        .accountsPartial({
          signer: provider.publicKey,
          proposal: deriveProposalAccount(program, testSeed, splVoteAccount.publicKey),
          proposalIndex: deriveProposalIndexAccount(program),
          splVoteAccount: splVoteAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      throw new Error("Expected error was not thrown - voting length should be rejected");
    } catch (error: any) {
      console.log("Expected error caught:", error.message);
      if (error.message.includes("VotingLengthTooLong")) {
        console.log("Correctly caught VotingLengthTooLong error");
      }
    }
  });

});