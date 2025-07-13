/**
 * Backend API Wrapper
 *
 * Usage examples:
 *
 * // For authenticated calls (NFID)
 * const agent = useAgent();
 * const api = createBackendAPI(agent);
 * const registrationResult = await api.register();
 * const profile = await api.getMyProfile();
 *
 * // For anonymous calls (no authentication required)
 * const anonymousApi = await createAnonymousBackendAPI();
 * const greeting = await anonymousApi.greet("Bob");
 */

import { Agent } from "@dfinity/agent";
import { createActor, createAnonymousActor } from "../agent";

// Types for backend responses
export interface UserProfile {
  principal: string;
  firstRegistered: bigint;
}

export interface BackendAPI {
  greet: (name: string) => Promise<string>;
  register: () => Promise<string>;
  getMyProfile: () => Promise<UserProfile | null>;
}

/**
 * Creates a backend API wrapper using NFID's agent
 * @param agent The agent from useAgent() hook
 * @returns Backend API methods
 */
export const createBackendAPI = (agent: Agent): BackendAPI => {
  console.log("create actor");
  const actor = createActor(agent);
  console.log("actor", actor);

  return {
    /**
     * Greets a user with the given name
     * @param name The name to greet
     * @returns A greeting message
     */
    greet: async (name: string): Promise<string> => {
      try {
        const result = await actor.greet(name);
        return result as string;
      } catch (error) {
        console.error("Error calling greet:", error);
        throw new Error("Failed to greet user");
      }
    },

    /**
     * Registers the current user in the system
     * @returns Registration status message
     */
    register: async (): Promise<string> => {
      try {
        const result = await actor.register();
        return result as string;
      } catch (error) {
        console.error("Error calling register:", error);
        throw new Error("Failed to register user");
      }
    },

    /**
     * Gets the current user's profile
     * @returns User profile or null if not found
     */
    getMyProfile: async (): Promise<UserProfile | null> => {
      try {
        const result = await actor.getMyProfile();
        const profileArray = result as UserProfile[];
        return profileArray.length > 0 ? profileArray[0] : null;
      } catch (error) {
        console.error("Error calling getMyProfile:", error);
        throw new Error("Failed to get user profile");
      }
    },
  };
};

/**
 * Creates a backend API for anonymous calls (public methods only)
 * @returns Backend API methods for anonymous calls
 */
export const createAnonymousBackendAPI = async (): Promise<
  Pick<BackendAPI, "greet">
> => {
  const actor = await createAnonymousActor();

  return {
    greet: async (name: string): Promise<string> => {
      try {
        const result = await actor.greet(name);
        return result as string;
      } catch (error) {
        console.error("Error calling greet:", error);
        throw new Error("Failed to greet user");
      }
    },
  };
};
