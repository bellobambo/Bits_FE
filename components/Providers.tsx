"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            error: {
              style: {
                background: "#F1E2D1",
                color: "#810B38",
                border: "1px solid rgba(129, 11, 56, 0.25)",
              },
            },
            success: {
              style: {
                background: "#F1E2D1",
                color: "#810B38",
                border: "1px solid rgba(129, 11, 56, 0.25)",
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
