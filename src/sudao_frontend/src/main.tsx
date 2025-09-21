import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CanistersProvider } from "@/contexts/canisters/provider";
import { AgentsProvider } from "@/contexts/agents/provider";
import { IdentityProvider } from "@/contexts/identity/provider.tsx";
import { PluginRegistryProvider } from "@/contexts/pluginRegistry/provider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CanistersProvider>
        <IdentityProvider>
          <AgentsProvider>
            <PluginRegistryProvider>
              <App />
            </PluginRegistryProvider>
          </AgentsProvider>
        </IdentityProvider>
      </CanistersProvider>
    </QueryClientProvider>
  </StrictMode>
);

declare global {
  interface BigInt {
    toJSON(): string;
  }
}
BigInt.prototype.toJSON = function () { return this.toString() }