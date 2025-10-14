"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppWalletProvider from "../components/AppWalletProvider";
import { EndpointProvider } from "../contexts/EndpointContext";
import { ProgramIdProvider } from "../contexts/ProgramIdContext";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 10 },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EndpointProvider>
      <ProgramIdProvider>
        <AppWalletProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppWalletProvider>
      </ProgramIdProvider>
    </EndpointProvider>
  );
}
