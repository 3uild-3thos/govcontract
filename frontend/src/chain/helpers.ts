import { Govcontract } from "@/chain";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

import idl from "@/chain/idl/govcontract.json";

// const RPC_URL = "https://api.devnet.solana.com";
const RPC_URL = "https://api.testnet.solana.com";

export const connection = new Connection(RPC_URL, "confirmed");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dummyWallet: any = {
  publicKey: Keypair.generate().publicKey,
  signAllTransactions: async () => {},
  signTransaction: async () => {},
};

const provider = new AnchorProvider(connection, dummyWallet, {
  commitment: "confirmed",
});

export const program = new Program(idl, provider) as Program<Govcontract>;
