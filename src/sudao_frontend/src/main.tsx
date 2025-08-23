import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider } from "@nfid/identitykit/react";
import { IdentityKitAuthType, InternetIdentity, NFIDW } from "@nfid/identitykit";
import { canisterId as backendCanId } from "declarations/sudao_backend";
import { canisterId as explorerCanId } from "declarations/sudao_be_explorer";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IdentityKitProvider 
      signers={[InternetIdentity, NFIDW]}
      signerClientOptions={{targets: [backendCanId, explorerCanId]}}
      authType={IdentityKitAuthType.DELEGATION}
    >
      <App />
    </IdentityKitProvider>
  </StrictMode>
);
