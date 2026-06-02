"use client";

import { useState, type ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io:443", network: "testnet" },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>{children}</WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ReactLenis>
  );
}
