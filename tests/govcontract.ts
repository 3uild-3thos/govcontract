import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Govcontract } from "../target/types/govcontract";
import { randomBytes } from "crypto";

describe("govcontract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.govcontract as Program<Govcontract>;

  const seed = new anchor.BN(randomBytes(8));
  const proposalAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("proposal"), seed.toArrayLike(Buffer, "le", 8), provider.publicKey.toBuffer()], program.programId)[0];

  const proposalAccounts = program.account.proposal.all(); // returns a promise

  const supportAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("support"), proposalAccount.toBuffer(), provider.publicKey.toBuffer()], program.programId)[0];

  const voteAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from("vote"), proposalAccount.toBuffer(), provider.publicKey.toBuffer()], program.programId)[0];

  const fetchedVoteAccount = program.account.vote.fetch(voteAccount); // returns a promise

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

  it("Cast Vote!", async () => {
    const tx = await program.methods.castVote(new anchor.BN(4_000), new anchor.BN(4_000), new anchor.BN(2_000)) 
    .accountsPartial({
      signer: provider.publicKey,
      proposal: proposalAccount,
      vote: voteAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

    console.log("\nVote Casted Successfuly!");
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
