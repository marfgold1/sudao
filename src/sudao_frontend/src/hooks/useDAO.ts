import { useContext } from "react";
import { DAOContext } from "@/contexts/dao/context";

export const useDAO = () => {
  const daoContext = useContext(DAOContext);
  if (!daoContext) {
    throw new Error("useDAO must be used within a DAOProvider");
  }

  const { daoInfo, deploymentInfo, isLoading, error, refetch } = daoContext;

  return {
    daoInfo,
    deploymentInfo,
    isLoading,
    error,
    refetch,
  };
};
