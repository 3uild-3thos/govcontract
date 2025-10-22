import type { IdlAccounts, Program } from "@coral-xyz/anchor";

import { Govcontract } from "./govcontractV2";

export type GovContractProgram = Program<Govcontract>;

export type ProposalAccount = IdlAccounts<Govcontract>["proposal"];
export type VoteAccount = IdlAccounts<Govcontract>["vote"];
