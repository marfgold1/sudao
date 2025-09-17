import React, { createContext } from "react";

export type CanisterIds = {
  daoBe: string | null;
  daoLedger: string | null;
  daoAmm: string | null;
  icpLedger: string;
};

type CanistersContextType = {
  canisterIds: CanisterIds;
  setCanisterIds: React.Dispatch<React.SetStateAction<CanisterIds>>;
};

export const CanistersContext = createContext<CanistersContextType | undefined>(undefined);
