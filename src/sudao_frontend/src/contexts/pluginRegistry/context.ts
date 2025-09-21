import { createContext, useContext } from 'react';

export type PluginType = 'proposal';

export interface PluginRegistryContextType {
  checkPluginRegistration: (daoId: string, pluginType: PluginType) => Promise<boolean>;
  updatePluginRegistration: (daoId: string, pluginType: PluginType, isRegistered: boolean) => void;
  registrationMemo: Record<string, Record<PluginType, boolean>>;
}

export const PluginRegistryContext = createContext<PluginRegistryContextType | undefined>(undefined);

export const usePluginRegistry = () => {
  const context = useContext(PluginRegistryContext);
  if (!context) {
    throw new Error('usePluginRegistry must be used within a PluginRegistryProvider');
  }
  return context;
};