import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import {
  idlFactory as explorerIdlFactory,
  canisterId as explorerCanisterId,
} from "declarations/sudao_be_explorer";
import type { _SERVICE as ExplorerService } from "declarations/sudao_be_explorer/sudao_be_explorer.did";

export interface DAOEntry {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: bigint;
  creator: string;
}

export interface CreateDAORequest {
  name: string;
  description: string;
  tags: string[];
}

export interface DeploymentInfo {
  status:
    | { Pending: null }
    | { Deploying: null }
    | { Deployed: { canisterId: string } }
    | { Failed: { error: string } };
  startedAt: bigint;
  completedAt?: bigint;
}

export const getExplorerActor = async (agent?: HttpAgent): Promise<
  ActorSubclass<ExplorerService>
> => {
  console.log('[EXPLORER] Creating explorer actor with canisterId:', explorerCanisterId);
  console.log('[EXPLORER] Agent provided:', !!agent);
  
  let httpAgent = agent;
  
  if (!httpAgent) {
    console.log('[EXPLORER] No agent provided, creating new HttpAgent');
    httpAgent = new HttpAgent();
    if (process.env.DFX_NETWORK !== "ic") {
      console.log('[EXPLORER] Fetching root key for local development');
      await httpAgent.fetchRootKey();
    }
  }

  const actor = Actor.createActor<ExplorerService>(explorerIdlFactory, {
    agent: httpAgent,
    canisterId: explorerCanisterId,
  });
  
  console.log('[EXPLORER] Actor created successfully');
  return actor;
};

export const listDAOs = async (): Promise<
  Array<[DAOEntry, DeploymentInfo | null]>
> => {
  console.log('[EXPLORER] listDAOs called (unauthenticated)');
  
  try {
    const actor = await getExplorerActor(); // Always use unauthenticated agent
    console.log('[EXPLORER] Calling listDAOs on canister:', explorerCanisterId);
    
    const result = await actor.listDAOs();
    console.log('[EXPLORER] listDAOs result:', result);
    console.log('[EXPLORER] Number of DAOs found:', result.length);

    const mappedResult = result.map(([dao, deployment]) => {
      // Data comes as arrays, extract first element
      const daoData = dao?.[0] || dao;
      const deploymentData = deployment?.[0] || deployment;
      
      return [
        {
          id: daoData.id,
          name: daoData.name,
          description: daoData.description,
          tags: daoData.tags,
          createdAt: daoData.createdAt,
          creator: daoData.creator?.__principal__ || daoData.creator?.toString() || 'unknown',
        },
        deploymentData
          ? {
              status: deploymentData.status,
              startedAt: deploymentData.startedAt || deploymentData.createdAt,
              completedAt: deploymentData.completedAt || deploymentData.lastUpdate,
            }
          : null,
      ];
    });
    
    console.log('[EXPLORER] listDAOs mapped result:', mappedResult);
    return mappedResult;
  } catch (error) {
    console.error('[EXPLORER] listDAOs error:', error);
    throw error;
  }
};

export const createDAO = async (request: CreateDAORequest, agent?: HttpAgent): Promise<string> => {
  console.log('[EXPLORER] createDAO called with request:', request);
  console.log('[EXPLORER] Agent provided:', !!agent);
  
  try {
    const actor = await getExplorerActor(agent);
    console.log('[EXPLORER] Calling addDAO on canister:', explorerCanisterId);
    
    const result = await actor.addDAO(request);
    console.log('[EXPLORER] addDAO result:', result);

    if ("ok" in result) {
      console.log('[EXPLORER] createDAO success, DAO ID:', result.ok);
      return result.ok;
    } else {
      console.error('[EXPLORER] createDAO error:', result.err);
      throw new Error(result.err);
    }
  } catch (error) {
    console.error('[EXPLORER] createDAO exception:', error);
    throw error;
  }
};

export const getDAO = async (
  daoId: string
): Promise<[DAOEntry | null, DeploymentInfo | null]> => {
  console.log('[EXPLORER] getDAO called with daoId:', daoId, '(unauthenticated)');
  
  try {
    const actor = await getExplorerActor(); // Always use unauthenticated agent
    console.log('[EXPLORER] Calling getDAO on canister:', explorerCanisterId);
    
    const [dao, deployment] = await actor.getDAO(daoId);
    console.log('[EXPLORER] getDAO result - dao:', dao);
    console.log('[EXPLORER] getDAO result - deployment:', deployment);
    console.log('[EXPLORER] Raw dao structure:', JSON.stringify(dao, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    console.log('[EXPLORER] Raw deployment structure:', JSON.stringify(deployment, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    // Data comes as arrays, extract first element
    const daoData = dao?.[0];
    const deploymentData = deployment?.[0];
    
    const mappedResult: [DAOEntry | null, DeploymentInfo | null] = [
      daoData
        ? {
            id: daoData.id,
            name: daoData.name,
            description: daoData.description,
            tags: daoData.tags,
            createdAt: daoData.createdAt,
            creator: daoData.creator?.__principal__ || 'unknown',
          }
        : null,
      deploymentData
        ? {
            status: deploymentData.status,
            startedAt: deploymentData.startedAt || deploymentData.createdAt,
            completedAt: deploymentData.completedAt || deploymentData.lastUpdate,
            canisterIds: deploymentData.canisterIds,
          }
        : null,
    ];
    
    console.log('[EXPLORER] getDAO mapped result:', mappedResult);
    return mappedResult;
  } catch (error) {
    console.error('[EXPLORER] getDAO error:', error);
    throw error;
  }
};
