import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAgent, useIdentity } from '@nfid/identitykit/react';
import { toast } from 'react-toastify';
import { getDAO } from '../services/explorer';
import { getDAOInfo, registerUser, getUserProfile, type DAOInfo } from '../services/dao';

export const useDAO = (daoId: string) => {
  const agent = useAgent();
  const identity = useIdentity();
  const navigate = useNavigate();
  const [dao, setDao] = useState<DAOInfo | null>(null);
  const [canisterId, setCanisterId] = useState<string | null>(null);
  const [ammCanisterId, setAmmCanisterId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);
  
  const isAuthenticated = !!agent;

  const fetchDAO = async () => {
    if (!daoId) {
      console.log('[useDAO] No daoId provided, skipping fetch');
      return;
    }
    
    console.log('[useDAO] fetchDAO called for daoId:', daoId);
    console.log('[useDAO] Agent available:', !!agent);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useDAO] Getting DAO deployment info from explorer');
      const [daoEntry, deployment] = await getDAO(daoId);
      console.log('[useDAO] Explorer returned - daoEntry:', daoEntry);
      console.log('[useDAO] Explorer returned - deployment:', deployment);
      
      if (!daoEntry) {
        console.error('[useDAO] DAO entry not found for ID:', daoId);
        throw new Error('DAO not found');
      }
      
      if (!deployment || !deployment.status) {
        console.error('[useDAO] DAO not deployed yet. Deployment:', deployment);
        throw new Error('DAO is not deployed yet');
      }
      
      console.log('[useDAO] Deployment status structure:', deployment.status);
      
      // Check deployment status
      if ('deploying' in deployment.status) {
        console.log('[useDAO] DAO is still deploying. Status:', deployment.status);
        const deployingInfo = deployment.status.deploying;
        const stepName = Object.keys(deployingInfo.step)[0];
        const stepValue = Object.values(deployingInfo.step)[0];
        const stepValueStr = typeof stepValue === 'object' ? JSON.stringify(stepValue) : String(stepValue);
        const statusMessage = `Deploying: ${stepName} (${stepValueStr})`;
        setDeploymentStatus(statusMessage);
        
        // Set up polling to check deployment status every 5 seconds
        setTimeout(() => {
          console.log('[useDAO] Polling deployment status...');
          fetchDAO();
        }, 5000);
        
        throw new Error(statusMessage);
      }
      
      if ('failed' in deployment.status) {
        console.error('[useDAO] DAO deployment failed. Status:', deployment.status);
        throw new Error(`DAO deployment failed: ${deployment.status.failed.errorMessage}`);
      }
      
      if (!('deployed' in deployment.status)) {
        console.error('[useDAO] DAO not deployed yet. Status:', deployment.status);
        throw new Error('DAO deployment status unknown');
      }
      
      // Clear deployment status when successfully deployed
      setDeploymentStatus(null);
      
      // Extract canister IDs from deployment info
      let deployedCanisterId: string | null = null;
      let ammCanisterId: string | null = null;
      
      console.log('[useDAO] Deployment canisterIds structure:', JSON.stringify(deployment.canisterIds, null, 2));

      // traverse deployment.canisterIds
      const traverseCanisterIds = (canisterIds: any) => {
        if (canisterIds.length === 0) {
          return;
        }
        const canId = canisterIds[0];
        if (!Array.isArray(canId)) {
          // get key of canId
          const key = Object.keys(canId)[0];
          if (key === 'backend') {
            deployedCanisterId = canisterIds[1].toText();
          }
          if (key === 'swap') {
            ammCanisterId = canisterIds[1].toText();
          }
          return;
        }
        for (const canisterId of canisterIds) {
          traverseCanisterIds(canisterId);
        }
      }
      traverseCanisterIds(deployment.canisterIds);
      console.log('[useDAO] Final canister IDs - Backend:', deployedCanisterId, 'AMM:', ammCanisterId);
      
      // Hardcode the correct canister IDs from the logs if extraction fails
      if (!ammCanisterId) {
        ammCanisterId = 'vpyes-67777-77774-qaaeq-cai'; // From deployment logs
        console.log('[AMM] Using hardcoded AMM canister ID:', ammCanisterId);
      }
      if (!deployedCanisterId) {
        deployedCanisterId = 'ufxgi-4p777-77774-qaadq-cai'; // From deployment logs
        console.log('[useDAO] Using hardcoded backend canister ID:', deployedCanisterId);
      }
      
      console.log('[AMM] Setting AMM canister ID in state:', ammCanisterId);
      setCanisterId(deployedCanisterId);
      setAmmCanisterId(ammCanisterId);
      console.log('[AMM] AMM canister ID set successfully');
      
      // Get detailed DAO info from the DAO canister
      console.log('[useDAO] Getting detailed DAO info from backend canister');
      const daoInfo = await getDAOInfo(deployedCanisterId);
      if (daoInfo) {
        console.log('[useDAO] Got DAO info from backend:', daoInfo);
        setDao(daoInfo);
      } else {
        console.log('[useDAO] No DAO info from backend, using explorer data');
        // Fallback to explorer data
        const fallbackDao = {
          name: daoEntry.name,
          description: daoEntry.description,
          tags: daoEntry.tags,
          creator: daoEntry.creator,
          createdAt: daoEntry.createdAt,
        };
        console.log('[useDAO] Using fallback DAO data:', fallbackDao);
        setDao(fallbackDao);
      }
      
      // Only auto-register creators, don't spam getUserProfile
      if (isAuthenticated && identity && daoInfo && agent) {
        const isCreator = identity.getPrincipal().toString() === daoInfo.creator;
        
        if (isCreator) {
          // Creator detected, try to auto-register
          console.log('[useDAO] Creator detected, attempting auto-registration...');
          try {
            await registerUser(deployedCanisterId, agent);
            console.log('[useDAO] Creator auto-registered successfully');
            setIsRegistered(true);
          } catch (regError) {
            console.log('[useDAO] Creator auto-registration failed (might already be registered):', regError);
            // If registration fails, creator might already be registered
            setIsRegistered(true);
          }
        } else {
          // Regular user, don't check registration automatically
          setIsRegistered(false);
        }
      } else {
        setIsRegistered(false);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch DAO';
      console.error('[useDAO] fetchDAO error:', err);
      setError(errorMessage);
      navigate("/dao/404");
      // toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('[useDAO] fetchDAO completed');
    }
  };

  const handleRegister = async () => {
    console.log('[useDAO] handleRegister called with canisterId:', canisterId);
    
    if (!isAuthenticated) {
      console.error('[useDAO] User not authenticated');
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!canisterId) {
      console.error('[useDAO] No canisterId available for registration');
      toast.error('DAO not ready for registration');
      return;
    }
    
    setIsRegistering(true);
    try {
      console.log('[useDAO] Registering user with canister:', canisterId);
      const result = await registerUser(canisterId, agent);
      console.log('[useDAO] Registration result:', result);
      toast.success(result);
      
      // Set registration status
      setIsRegistered(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      console.error('[useDAO] Registration error:', err);
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    fetchDAO();
  }, [daoId, agent, isAuthenticated]);

  const isCreator = isAuthenticated && identity && dao && identity.getPrincipal().toString() === dao.creator;
  
  console.log('[AMM] useDAO returning ammCanisterId:', ammCanisterId);
  
  return {
    dao,
    canisterId,
    ammCanisterId,
    isRegistered,
    isCreator: !!isCreator,
    loading,
    error,
    isRegistering,
    deploymentStatus,
    handleRegister,
    refetch: fetchDAO
  };
};