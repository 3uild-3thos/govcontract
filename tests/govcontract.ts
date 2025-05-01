import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Govcontract } from "../target/types/govcontract";
import { randomBytes } from "crypto";
import { Connection, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

describe("govcontract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.govcontract as Program<Govcontract>;

  const payer = provider.wallet as NodeWallet;

  const seed = new anchor.BN(randomBytes(8));
  const proposalAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("proposal"), seed.toArrayLike(Buffer, "le", 8), provider.publicKey.toBuffer()], program.programId)[0];
  console.log("\nProposal Account: ", proposalAccount.toBase58());

  const proposalAccounts = program.account.proposal.all(); // returns a promise

  const supportAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("support"), proposalAccount.toBuffer(), provider.publicKey.toBuffer()], program.programId)[0];

  const voteAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("vote"), proposalAccount.toBuffer(), provider.publicKey.toBuffer()], program.programId)[0];
  console.log("\nValidator 1 Public Key: ", provider.publicKey.toBase58());
  console.log("Validator 1 Vote Account: ", voteAccount.toBase58());

  const vote2 = anchor.web3.Keypair.generate();
  const voteAccount2 = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("vote"), proposalAccount.toBuffer(), vote2.publicKey.toBuffer()], program.programId)[0];
  console.log("\nValidator 2 Public Key: ", vote2.publicKey.toBase58());
  console.log("Validator 2 Vote Account: ", voteAccount2.toBase58());

  const vote3 = anchor.web3.Keypair.generate();
  const voteAccount3 = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("vote"), proposalAccount.toBuffer(), vote3.publicKey.toBuffer()], program.programId)[0];
  console.log("\nValidator 3 Public Key: ", vote3.publicKey.toBase58());
  console.log("Validator 3 Vote Account: ", voteAccount3.toBase58());

  const fetchedVoteAccount = program.account.vote.fetch(voteAccount); // returns a promise

  it("Fund Dummy Validator Accounts!", async () => {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    const lamportsToSend = 10_000_000;

    const transferTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: vote2.publicKey,
        lamports: lamportsToSend
      }),
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: vote3.publicKey,
        lamports: lamportsToSend
      })
    )

    await sendAndConfirmTransaction(connection, transferTransaction, [payer.payer]);

    console.log("\nDummy Validator Accounts Funded Successfuly!");
  });

  it("Create Proposal!", async () => {
    const tx = await program.methods.createProposal(seed, "Proposal1", "Description1", new anchor.BN(0), new anchor.BN(1))
    .accountsPartial({
      signer: provider.publicKey,
      proposal: proposalAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

    console.log("\nNew Proposal Successfuly Created!");
    console.log("Your transaction signature", tx);
  });

  it("Support Proposal!", async () => {
    const tx = await program.methods.supportProposal()
    .accountsPartial({
      signer: provider.publicKey,
      proposal: proposalAccount,
      support: supportAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
    
    console.log("\nProposal Supported Sucessfully!");
    console.log("Your transaction signature", tx);
  });

  it("Cast Vote for Validator 1!", async () => {
    const tx = await program.methods.castVote(new anchor.BN(4_000), new anchor.BN(4_000), new anchor.BN(2_000)) 
    .accountsPartial({
      signer: provider.publicKey,
      proposal: proposalAccount,
      vote: voteAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

    console.log("\nVote Casted Successfuly for Validator 1!");
    console.log("Your transaction signature", tx);
  });

  it("Cast Vote for Validator 2!", async () => {
    const tx = await program.methods.castVote(new anchor.BN(4_000), new anchor.BN(4_000), new anchor.BN(2_000)) 
    .accountsPartial({
      signer: vote2.publicKey,
      proposal: proposalAccount,
      vote: voteAccount2,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([vote2])
    .rpc();

    console.log("\nVote Casted Successfuly for Validator 2!");
    console.log("Your transaction signature", tx);
  });

  it("Cast Vote for Validator 3!", async () => {
    const tx = await program.methods.castVote(new anchor.BN(4_000), new anchor.BN(4_000), new anchor.BN(2_000)) 
    .accountsPartial({
      signer: vote3.publicKey,
      proposal: proposalAccount,
      vote: voteAccount3,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([vote3])
    .rpc();

    console.log("\nVote Casted Successfuly for Validator 3!");
    console.log("Your transaction signature", tx);
  });

  it("Modify Vote!", async () => {
    const tx = await program.methods.modifyVote(new anchor.BN(4_000), new anchor.BN(2_000), new anchor.BN(4_000))
    .accountsPartial({
      signer: provider.publicKey,
      proposal: proposalAccount,
      vote: voteAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

    console.log("\nVote Modified Successfuly!");
    console.log("Your transaction signature", tx);
  });
});
