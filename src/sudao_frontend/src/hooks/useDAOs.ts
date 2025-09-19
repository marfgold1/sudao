import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAgents } from '@/hooks/useAgents';
import { CreateDAORequest, DAOEntry, DeploymentInfo } from 'declarations/sudao_be_explorer/sudao_be_explorer.did';
import { matchVariant, Opt } from '@/utils/converter';
import { AnonPrincipal } from '@/utils/common';
import { discoverCollectives, userCollectives } from '@/mocks';

export const useDAOs = () => {
  const [daos, setDaos] = useState<[DAOEntry, DeploymentInfo | null][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agents } = useAgents();

  const explorerDao = agents.explorerDao;

  const fetchDAOs = useCallback(async () => {
    console.log('[useDAOs] fetchDAOs called with agent:', explorerDao);
    setLoading(true);
    setError(null);
    try {
      console.log('[useDAOs] Calling listDAOs service');
      const daosOpt = await explorerDao.listDAOs();
      const result = daosOpt.map(([dao, deployment]) => [dao, Opt(deployment)] as [DAOEntry, DeploymentInfo | null]);
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
            creator: AnonPrincipal
          },
          {
            status: { deployed: { deployedAt: BigInt(Date.now() * 1000000) } },
            createdAt: BigInt(Date.now() * 1000000),
            canisterIds: [],
            lastUpdate: BigInt(Date.now() * 1000000)
          }
        ] as [DAOEntry, DeploymentInfo | null])),
        ...userCollectives.map(dao => ([
          {
            id: dao.id,
            name: dao.name,
            description: dao.description,
            tags: dao.tags,
            createdAt: BigInt(Date.now() * 1000000),
            creator: AnonPrincipal
          },
          {
            status: { deployed: { deployedAt: BigInt(Date.now() * 1000000) } },
            createdAt: BigInt(Date.now() * 1000000),
            canisterIds: [],
            lastUpdate: BigInt(Date.now() * 1000000)
          }
        ] as [DAOEntry, DeploymentInfo | null]))
      ];
      setDaos(mockDAOs);
    } finally {
      setLoading(false);
    }
  }, [explorerDao]);

  const createNewDAO = useCallback(async (request: CreateDAORequest) => {
    console.log('[useDAOs] createNewDAO called with request:', request);

    try {
      console.log('[useDAOs] Calling createDAO service');
      const res = await explorerDao.addDAO(request);
      return matchVariant(res, {
        ok: (result) => {
          console.log('[useDAOs] createDAO call completed:', result);
          toast.success(`DAO "${request.name}" creation initiated!`);
          fetchDAOs();
          return result;
        },
        err: (error) => {
          toast.error(error);
          return null;
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create DAO';
      console.error('[useDAOs] createDAO call failed, but assuming async creation');
      toast.error(errorMessage);
      return null;
    }
  }, [explorerDao, fetchDAOs]);

  return {
    daos,
    loading,
    error,
    fetchDAOs,
    createNewDAO
  };
};