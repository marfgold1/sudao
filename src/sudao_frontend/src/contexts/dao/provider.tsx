import { useAgents } from "@/hooks/useAgents";
import { DAOContext } from "./context";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { iterLinkList, matchVariant, Opt } from "@/utils/converter";
import { useEffect } from "react";

type DAOProviderType = {
  daoId: string;
  children: React.ReactNode;
};

const daoKey = (daoId: string) => ["dao", daoId];

export const DAOProvider = ({ daoId, children }: DAOProviderType) => {
  const {
    agents: { explorerDao },
    setCanisterIds,
  } = useAgents();
  const queryClient = useQueryClient();

  const queryKey = daoKey(daoId);

  // First fetch from explorerDao
  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log("[useDAO] Getting DAO deployment info from explorer");
      const res = await explorerDao.getDAO(daoId);
      console.log("[useDAO] Explorer returned:", res);
      return {
        daoEntry: Opt(res[0]),
        deployment: Opt(res[1]),
      };
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const deploymentInfo = data?.deployment;

  useEffect(() => {
    console.log("[useDAO] Explorer returned - deployment:", deploymentInfo);
    if (deploymentInfo) {
      const canIds: Record<string, string> = {};
      for (const [codeType, canisterId] of iterLinkList(
        deploymentInfo.canisterIds
      )) {
        matchVariant(codeType, {
          backend: () => (canIds.daoBe = canisterId.toText()),
          ledger: () => (canIds.daoLedger = canisterId.toText()),
          swap: () => (canIds.daoAmm = canisterId.toText()),
        });
      }
      setCanisterIds((prev) => ({ ...prev, ...canIds }));
    }
  }, [deploymentInfo, setCanisterIds]);

  return (
    <DAOContext.Provider
      value={{
        daoInfo: data?.daoEntry,
        deploymentInfo,
        isLoading,
        error: error?.message,
        refetch,
      }}
    >
      {children}
    </DAOContext.Provider>
  );
};
