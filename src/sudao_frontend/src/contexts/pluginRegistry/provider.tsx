import { useState, useCallback, useMemo } from 'react';
import { PluginRegistryContext, PluginType } from './context';
import { createProposalService } from '../../services/proposal';
import { useAgents } from '../../hooks/useAgents';
import { handleCertificateError } from '../../utils/errorHandler';

interface PluginChecker {
  isRegistered: (daoId: string) => Promise<boolean>;
}

export const PluginRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const { agents } = useAgents();
  const [registrationMemo, setRegistrationMemo] = useState<Record<string, Record<PluginType, boolean>>>({});

  const pluginCheckers: Record<PluginType, PluginChecker> = useMemo(() => ({
    proposal: {
      isRegistered: async (daoId: string) => {
        const proposalService = createProposalService(agents.proposal);
        return await proposalService.isDAORegistered(daoId);
      }
    }
  }), [agents.proposal]);

  const checkPluginRegistration = useCallback(async (daoId: string, pluginType: PluginType): Promise<boolean> => {
    // Check memo first
    if (registrationMemo[daoId]?.[pluginType] !== undefined) {
      console.log(`[PluginRegistry] Using cached result for ${daoId}:${pluginType} = ${registrationMemo[daoId][pluginType]}`);
      return registrationMemo[daoId][pluginType];
    }

    console.log(`[PluginRegistry] Checking registration for ${daoId}:${pluginType}`);
    
    // Check with plugin
    const checker = pluginCheckers[pluginType];
    let isRegistered;
    try {
      isRegistered = await checker.isRegistered(daoId);
    } catch (err) {
      // Handle certificate errors with auto-reload
      if (handleCertificateError(err)) {
        return false; // Page will reload
      }
      throw err;
    }

    // Save to memo
    setRegistrationMemo(prev => ({
      ...prev,
      [daoId]: {
        ...prev[daoId],
        [pluginType]: isRegistered
      }
    }));

    console.log(`[PluginRegistry] Cached result for ${daoId}:${pluginType} = ${isRegistered}`);
    return isRegistered;
  }, [registrationMemo, pluginCheckers]);

  const updatePluginRegistration = useCallback((daoId: string, pluginType: PluginType, isRegistered: boolean) => {
    console.log(`[PluginRegistry] Updating registration for ${daoId}:${pluginType} = ${isRegistered}`);
    setRegistrationMemo(prev => ({
      ...prev,
      [daoId]: {
        ...prev[daoId],
        [pluginType]: isRegistered
      }
    }));
  }, []);

  return (
    <PluginRegistryContext.Provider value={{
      checkPluginRegistration,
      updatePluginRegistration,
      registrationMemo
    }}>
      {children}
    </PluginRegistryContext.Provider>
  );
};