import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider } from "@nfid/identitykit/react";
import { IdentityKitAuthType, InternetIdentity, NFIDW } from "@nfid/identitykit";
import { canisterId as iiCanId } from "declarations/internet_identity";
import { canisterId as backendCanId } from "declarations/sudao_backend";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IdentityKitProvider 
      signers={[{
        ...InternetIdentity,
        providerUrl: `http://${iiCanId}.localhost:4943`,
      }, NFIDW]}
      signerClientOptions={{targets: [backendCanId]}}
      authType={IdentityKitAuthType.DELEGATION}
    >
      <App />
    </IdentityKitProvider>
  </StrictMode>
);
