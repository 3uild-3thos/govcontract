"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppWalletProvider from "../components/AppWalletProvider";
import { EndpointProvider } from "../contexts/EndpointContext";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 10 },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EndpointProvider>
      <AppWalletProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AppWalletProvider>
    </EndpointProvider>
  );
}
