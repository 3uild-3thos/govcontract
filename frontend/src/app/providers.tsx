"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import AppWalletProvider from "../components/AppWalletProvider";
import { EndpointProvider } from "../contexts/EndpointContext";
import { NcnApiProvider } from "../contexts/NcnApiContext";
import { captureException } from "@sentry/nextjs";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 10 },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("Query error:", error);
      captureException(error);
    },
  }),
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <EndpointProvider>
        <NcnApiProvider>
          <AppWalletProvider>{children}</AppWalletProvider>
        </NcnApiProvider>
      </EndpointProvider>
    </QueryClientProvider>
  );
}
