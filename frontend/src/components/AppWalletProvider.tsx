"use client";
 
import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useEndpoint } from "@/contexts/EndpointContext";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";


export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { endpoint } = useEndpoint();
  const network = WalletAdapterNetwork.Devnet;
  const wallets = useMemo(
    () => [
      // manually add any legacy wallet adapters here
      // new UnsafeBurnerWalletAdapter(),
    ],
    [network],
  );
 
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}