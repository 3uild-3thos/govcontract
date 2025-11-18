import { SupportAccount } from "@/chain";
import { PublicKey } from "@solana/web3.js";

export interface SupportAccountData {
  publicKey: PublicKey;
  proposal: PublicKey;
  validator: PublicKey;
  bump: number;
}

export interface RawSupportAccountDataAccount {
  account: SupportAccount;
  publicKey: PublicKey;
}
