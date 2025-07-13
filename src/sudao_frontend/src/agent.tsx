import { Actor, ActorSubclass, Agent } from "@dfinity/agent";

// Import the auto-generated Candid interface for your backend canister
import { idlFactory as backend_idl } from "declarations/sudao_backend";

// Get the canister ID - try multiple sources
const getCanisterId = (): string => {
  // Try environment variable first
  const envCanisterId = process.env.CANISTER_ID_SUDAO_BACKEND;
  if (envCanisterId) return envCanisterId;

  // Fallback to hardcoded local canister ID (from dfx deploy output)
  const fallbackCanisterId = "uxrrr-q7777-77774-qaaaq-cai";
  console.warn(`Using fallback canister ID: ${fallbackCanisterId}`);
  return fallbackCanisterId;
};

const canisterId = getCanisterId();

/**
 * Creates an actor using NFID's agent (primary authentication method)
 * @param agent The agent from useAgent() hook
 * @returns ActorSubclass for backend canister
 */
export const createActor = (agent: Agent): ActorSubclass => {
  if (!agent) {
    throw new Error(
      "Agent is required. Make sure user is authenticated with NFID."
    );
  }

  return Actor.createActor(backend_idl, {
    agent,
    canisterId,
  });
};

/**
 * Creates an anonymous actor for public methods (like greet)
 * @returns ActorSubclass for backend canister
 */
export const createAnonymousActor = async (): Promise<ActorSubclass> => {
  const { HttpAgent, AnonymousIdentity } = await import("@dfinity/agent");

  const agent = await HttpAgent.create({
    host: "http://127.0.0.1:4943",
    identity: new AnonymousIdentity(),
  });

  // For local development, fetch the root key
  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);
    });
  }

  return Actor.createActor(backend_idl, {
    agent,
    canisterId,
  });
};
