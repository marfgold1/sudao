import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useDAO } from "../hooks/useDAO";
import { DAOProvider } from "@/contexts/dao/provider";
import { isVariant } from "@/utils/converter";

export const DAOLayout = ({ children }: { children: React.ReactNode }) => {
  const { daoId } = useParams<{ daoId: string }>();

  return (
    <DAOProvider daoId={daoId || ""}>
      <DAOLayoutContent>{children}</DAOLayoutContent>
    </DAOProvider>
  );
};

const DAOLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { daoInfo, isLoading, error, deploymentInfo, refetch } = useDAO();

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (
      deploymentInfo == undefined ||
      isVariant(deploymentInfo.status, "deploying") ||
      isVariant(deploymentInfo.status, "queued")
    ) {
      timeout = setTimeout(() => {
        refetch();
      }, 200);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [deploymentInfo, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading DAO...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!daoInfo) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">DAO not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Content */}
      <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </div>
    </>
  );
};
