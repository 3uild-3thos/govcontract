"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { PublicKey } from "@solana/web3.js";

interface ProgramIdContextType {
  programId: PublicKey;
  programIdString: string;
  setProgramId: (programId: string) => void;
  resetToDefault: () => void;
}

const ProgramIdContext = createContext<ProgramIdContextType | undefined>(
  undefined
);

const DEFAULT_PROGRAM_ID = "6RHAsY36k1uzcBzfQs8Qyuw48uyDfHGvLPjTBvZfTwEu";
const STORAGE_KEY = "solana-program-id";

export function ProgramIdProvider({ children }: { children: ReactNode }) {
  const [programIdString, setProgramIdString] =
    useState<string>(DEFAULT_PROGRAM_ID);
  const [programId, setProgramIdState] = useState<PublicKey>(
    new PublicKey(DEFAULT_PROGRAM_ID)
  );

  // Load program ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const pubkey = new PublicKey(saved);
          setProgramIdString(saved);
          setProgramIdState(pubkey);
        } catch (error) {
          console.warn("Invalid saved program ID, using default:", error);
          // Keep default values if saved ID is invalid
        }
      }
    }
  }, []);

  const setProgramId = (newProgramId: string) => {
    try {
      const pubkey = new PublicKey(newProgramId);
      setProgramIdString(newProgramId);
      setProgramIdState(pubkey);

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newProgramId);
      }
    } catch (error) {
      throw new Error(`Invalid program ID: ${error}`);
    }
  };

  const resetToDefault = () => {
    setProgramIdString(DEFAULT_PROGRAM_ID);
    setProgramIdState(new PublicKey(DEFAULT_PROGRAM_ID));

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <ProgramIdContext.Provider
      value={{
        programId,
        programIdString,
        setProgramId,
        resetToDefault,
      }}
    >
      {children}
    </ProgramIdContext.Provider>
  );
}

export function useProgramId() {
  const context = useContext(ProgramIdContext);
  if (context === undefined) {
    throw new Error("useProgramId must be used within a ProgramIdProvider");
  }
  return context;
}
