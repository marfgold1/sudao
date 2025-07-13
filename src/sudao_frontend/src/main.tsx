import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider } from "@nfid/identitykit/react";
import { IdentityKitAuthType } from "@nfid/identitykit";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IdentityKitProvider authType={IdentityKitAuthType.ACCOUNTS}>
      <App />
    </IdentityKitProvider>
  </StrictMode>,
)
