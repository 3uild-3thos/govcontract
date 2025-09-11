import { InitializeIndexParams, TransactionResult } from "./types";

/**
 * Initialize Index is not implemented in the current program IDL.
 * This function returns a helpful error message.
 */
export async function initializeIndex(params: InitializeIndexParams): Promise<TransactionResult> {
  console.error("Error initializing index: Initialize Index instruction is not available in the current program");
  return {
    signature: "",
    success: false,
    error: "Initialize Index instruction is not available in the current program. This feature may need to be implemented in the smart contract first.",
  };
}
