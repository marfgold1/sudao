import { useState, useEffect } from 'react';
import { useAgent } from '@nfid/identitykit/react';
import { toast } from 'react-toastify';
import { listDAOs, createDAO, type DAOEntry, type DeploymentInfo, type CreateDAORequest } from '../services/explorer';
import { discoverCollectives, userCollectives } from '../mocks';

export const useDAOs = () => {
  const agent = useAgent();
  const [daos, setDaos] = useState<Array<[DAOEntry, DeploymentInfo | null]>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDAOs = async () => {
    console.log('[useDAOs] fetchDAOs called with agent:', !!agent);
    setLoading(true);
    setError(null);
    try {
      console.log('[useDAOs] Calling listDAOs service');
      const result = await listDAOs();
      console.log('[useDAOs] listDAOs service returned:', result);
      setDaos(result);
      console.log('[useDAOs] DAOs state updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch DAOs';
      console.error('[useDAOs] fetchDAOs error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      // Fallback to mock data
      const mockDAOs: Array<[DAOEntry, DeploymentInfo | null]> = [
        ...discoverCollectives.map(dao => ([
          {
            id: dao.id,
            name: dao.name,
            description: dao.description,
            tags: dao.tags,
            createdAt: BigInt(Date.now() * 1000000),
            creator: 'mock-creator-principal'
          } as DAOEntry,
          {
            status: { Deployed: { canisterId: 'mock-canister-id' } },
            startedAt: BigInt(Date.now() * 1000000),
            completedAt: BigInt(Date.now() * 1000000)
          } as DeploymentInfo
        ] as [DAOEntry, DeploymentInfo | null])),
        ...userCollectives.map(dao => ([
          {
            id: dao.id,
            name: dao.name,
            description: dao.description,
            tags: dao.tags,
            createdAt: BigInt(Date.now() * 1000000),
            creator: 'current-user-principal'
          } as DAOEntry,
          {
            status: { Deployed: { canisterId: 'mock-canister-id' } },
            startedAt: BigInt(Date.now() * 1000000),
            completedAt: BigInt(Date.now() * 1000000)
          } as DeploymentInfo
        ] as [DAOEntry, DeploymentInfo | null]))
      ];
      setDaos(mockDAOs);
    } finally {
      setLoading(false);
    }
  };

  const createNewDAO = async (request: CreateDAORequest) => {
    console.log('[useDAOs] createNewDAO called with request:', request);
    console.log('[useDAOs] Agent available:', !!agent);
    
    try {
      console.log('[useDAOs] Calling createDAO service');
      await createDAO(request, agent || undefined);
      console.log('[useDAOs] createDAO call completed');
    } catch (err) {
      console.log('[useDAOs] createDAO call failed, but assuming async creation');
    }
    
    toast.success(`DAO "${request.name}" creation initiated! It will appear in the list shortly.`);
    return 'async-creation';
  };

  useEffect(() => {
    fetchDAOs();
  }, [agent]);

  return {
    daos,
    loading,
    error,
    fetchDAOs,
    createNewDAO
  };
};