import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { DAOProvider } from '@/contexts/dao/provider';
import { formatTime, isVariant, keyVariant, matchVariant } from '@/utils/converter';

export const DAOLayout = ({ children }: { children: React.ReactNode }) => {
  const { daoId } = useParams<{ daoId: string }>();

  return (
    <DAOProvider
      daoId={daoId || ''}
    >
      <DAOLayoutContent>
        {children}
      </DAOLayoutContent>
    </DAOProvider>
  )
};

const DAOLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { daoInfo, isLoading, error, deploymentInfo, refetch } = useDAO();

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (
      deploymentInfo == undefined ||
      isVariant(deploymentInfo.status, 'deploying') ||
      isVariant(deploymentInfo.status, 'queued')
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

  // Check if it's a deployment status error
  if (deploymentInfo && !isVariant(deploymentInfo.status, 'deployed')) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
        <div className="container mx-auto px-4 py-6">
          <div className={`${isVariant(deploymentInfo.status, 'failed') ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'} rounded-lg p-6`}>
            <div className="flex items-center justify-center">
              {!isVariant(deploymentInfo.status, 'failed') && (
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />)}
              <div>
                <h3 className="text-lg font-semibold text-blue-800">DAO Deployment Status</h3>
                <p className="text-blue-600 mt-1 whitespace-pre-wrap">{
                  matchVariant(deploymentInfo.status, {
                    deploying: (val) => `DAO deployment in progress started at ${formatTime(val.startedAt)}\n\nCurrently in step: ${matchVariant(val.step, {
                      creating_canister: (v) => `creating canister ${keyVariant(v)}`,
                      installing_code: (v) => `installing code ${keyVariant(v)}`,
                    })}`,
                    failed: (val) => `DAO deployment failed at ${formatTime(val.failedAt)} with error:\n${val.errorMessage}.\n\nLast deployment status: ${matchVariant(val.lastDeploymentStatus, {
                      deployed: (val) => `deployed at ${formatTime(val.deployedAt)}`,
                      deploying: (val) => `deploying at ${formatTime(val.startedAt)} and currently in step: ${matchVariant(val.step, {
                        creating_canister: (v) => `creating canister ${keyVariant(v)}`,
                        installing_code: (v) => `installing code ${keyVariant(v)}`,
                      })}`,
                      failed: (val) => `failed at ${formatTime(val.failedAt)} with error: ${val.errorMessage}`,
                      queued: () => 'queued',
                    })}`,
                    queued: () => 'DAO deployment queued',
                  })
                }</p>
                {!isVariant(deploymentInfo.status, 'failed') && (
                  <p className="text-sm text-blue-500 mt-2">This usually takes 1-2 minutes. The page will automatically refresh.</p>
                )}
              </div>
            </div>
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
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </>
  );
}