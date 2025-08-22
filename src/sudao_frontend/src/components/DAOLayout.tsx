import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Home, FileText } from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { useIdentity, useAgent } from '@nfid/identitykit/react';
import { ConnectWallet } from '@nfid/identitykit/react';

interface DAOLayoutProps {
  children: React.ReactNode | ((props: { dao: any; canisterId: string | null; isRegistered: boolean; isCreator: boolean }) => React.ReactNode);
}

export const DAOLayout: React.FC<DAOLayoutProps> = ({ children }) => {
  const { daoId } = useParams<{ daoId: string }>();
  const location = useLocation();
  const identity = useIdentity();
  const agent = useAgent();
  const { dao, canisterId, isRegistered, isCreator, loading, error, isRegistering, deploymentStatus, handleRegister } = useDAO(daoId || '');
  
  const isAuthenticated = !!agent;

  if (loading) {
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
    // Check if it's a deployment status error
    if (deploymentStatus) {
      return (
        <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">DAO Deployment in Progress</h3>
                  <p className="text-blue-600 mt-1">{deploymentStatus}</p>
                  <p className="text-sm text-blue-500 mt-2">This usually takes 1-2 minutes. The page will automatically refresh.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
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

  if (!dao) {
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
      {typeof children === 'function' ? children({ 
        dao,
        canisterId, 
        isRegistered, 
        isCreator 
      }) : children}
    </>
  );
};