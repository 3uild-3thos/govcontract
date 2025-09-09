import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MockGovV1 } from "../target/types/mock_gov_v1";
import { randomBytes } from "crypto";
import { PublicKey } from "@solana/web3.js";

describe("mock_gov_v1", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.mock_gov_v1 as Program<MockGovV1>;

    // Setup test data
    const ballotId = new anchor.BN(12345);
    const metaMerkleRoot = Array.from(randomBytes(32));
    const snapshotHash = Array.from(randomBytes(32));
    const voteAccount = provider.publicKey;

   

    // Pre-derive PDAs for reuse
    const [consensusResultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ConsensusResult"), 
        ballotId.toArrayLike(Buffer, "le", 8)],
        program.programId
    );

    const metaMerkleProofPda = PublicKey.findProgramAddressSync(
        [Buffer.from("MetaMerkleProof"), 
        consensusResultPda.toBuffer(), 
        voteAccount.toBuffer()],
        program.programId
    )[0];


    it("Test Mock Gov V1 - Create Consensus Result", async () => {
        try {
            await program.methods
                .createConsensusResult(ballotId, metaMerkleRoot, snapshotHash)
                .accounts({
                    consensusResult: consensusResultPda,
                    payer: provider.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();
        } catch (error: any) {
            if (!error.message.includes("already in use")) throw error;
        }

        const result = await program.account.consensusResult.fetch(consensusResultPda);
        console.log(`Consensus Result: ballot_id=${result.ballotId.toString()}`);
    });

    it("Test Mock Gov V1 - Init Meta Merkle Proof", async () => {

        const leaf = {
            votingWallet: provider.publicKey,
            voteAccount: voteAccount,
            stakeMerkleRoot: Array.from(randomBytes(32)),
            activeStake: new anchor.BN(1000000),
        };
        const proof = [Array.from(randomBytes(32)), Array.from(randomBytes(32))];

        await program.methods
            .initMetaMerkleProof(leaf, proof)
            .accounts({
                payer: provider.publicKey,
                metaMerkleProof: metaMerkleProofPda,
                consensusResult: consensusResultPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const result = await program.account.metaMerkleProof.fetch(metaMerkleProofPda);
        console.log(`Meta Merkle Proof: wallet=${result.metaMerkleLeaf.votingWallet.toString().slice(0, 8)}..., stake=${result.metaMerkleLeaf.activeStake.toString()}, proof_len=${result.metaMerkleProof.length}`);
    });

    it("Test Mock Gov V1 - Verify Merkle Proof", async () => {
        const stakeProof = [Array.from(randomBytes(32))];
        const stakeLeaf = {
            votingWallet: provider.publicKey,
            stakeAccount: provider.publicKey,
            activeStake: new anchor.BN(500000),
        };

        await program.methods
            .verifyMerkleProof(stakeProof, stakeLeaf)
            .accounts({
                metaMerkleProof: metaMerkleProofPda,
                consensusResult: consensusResultPda,
            })
            .rpc();

        // await program.methods
        //     .verifyMerkleProof(null, null)
        //     .accounts({
        //         metaMerkleProof: metaMerkleProofPda,
        //         consensusResult: consensusResultPda,
        //     })
        //     .rpc();

        console.log("Merkle Proof verification completed");
    });

    it("Test Mock Gov V1 - Close Meta Merkle Proof", async () => {
        // const metaMerkleProofPda = getMetaMerkleProofPda(provider.publicKey);

        await program.methods
            .closeMetaMerkleProof()
            .accounts({
                metaMerkleProof: metaMerkleProofPda,
                payer: provider.publicKey,
            })
            .rpc();

        try {
            await program.account.metaMerkleProof.fetch(metaMerkleProofPda);
            throw new Error("Account should have been closed");
        } catch (error: any) {
            if (!error.message.includes("Account does not exist")) throw error;
        }

        console.log("Meta Merkle Proof account closed");
    });
});
