import React, { createContext, useContext } from "react";

export type CanisterIds = {
  daoBe: string | null;
  daoLedger: string | null;
  daoAmm: string | null;
  icpLedger: string;
  proposal: string;
};

type CanistersContextType = {
  canisterIds: CanisterIds;
  setCanisterIds: React.Dispatch<React.SetStateAction<CanisterIds>>;
};

export const CanistersContext = createContext<CanistersContextType | undefined>(undefined);

export const useCanisters = () => {
  const context = useContext(CanistersContext);
  if (context === undefined) {
    throw new Error('useCanisters must be used within a CanistersProvider');
  }
  return context;
};
