"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

interface EndpointContextType {
  endpoint: string;
  setEndpoint: (endpoint: string) => void;
  resetToDefault: () => void;
}

const EndpointContext = createContext<EndpointContextType | undefined>(undefined);

const DEFAULT_ENDPOINT = clusterApiUrl(WalletAdapterNetwork.Devnet);
const STORAGE_KEY = "solana-rpc-endpoint";

export function EndpointProvider({ children }: { children: ReactNode }) {
  const [endpoint, setEndpointState] = useState<string>(DEFAULT_ENDPOINT);

  // Load endpoint from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setEndpointState(saved);
      }
    }
  }, []);

  const setEndpoint = (newEndpoint: string) => {
    setEndpointState(newEndpoint);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newEndpoint);
    }
  };

  const resetToDefault = () => {
    setEndpointState(DEFAULT_ENDPOINT);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <EndpointContext.Provider value={{ endpoint, setEndpoint, resetToDefault }}>
      {children}
    </EndpointContext.Provider>
  );
}

export function useEndpoint() {
  const context = useContext(EndpointContext);
  if (context === undefined) {
    throw new Error("useEndpoint must be used within an EndpointProvider");
  }
  return context;
}
