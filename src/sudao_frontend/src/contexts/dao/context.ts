import type { DAOEntry, DeploymentInfo } from 'declarations/sudao_be_explorer/sudao_be_explorer.did';
import { createContext } from 'react';

type DAOContextType = {
  daoInfo?: DAOEntry;
  deploymentInfo?: DeploymentInfo;
  isLoading: boolean;
  error?: string;
  refetch: () => void;
};

export const DAOContext = createContext<DAOContextType | undefined>(undefined);
