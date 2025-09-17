import { useContext } from 'react';
import { DAOContext } from '@/contexts/dao/context';


export const useDAO = () => {
  const daoContext = useContext(DAOContext);
  if (!daoContext) {
    throw new Error('DAOContext not found');
  }

  const { daoInfo, deploymentInfo, isLoading, error, refetch } = daoContext;
  // const { currentAccount } = useAccount();

  // useEffect(() => {
  //   if (!daoBe) return;
  //   const autoRegister = async () => {
  //     // Only auto-register creators, don't spam getUserProfile
  //     if (currentAccount) {
  //       const isCreator = currentAccount.principal === dao?.creator;
        
  //       if (isCreator) {
  //         // Creator detected, try to auto-register
  //         console.log('[useDAO] Creator detected, attempting auto-registration...');
  //         try {
  //           const result = await daoBe.register();
  //           console.log('[useDAO] Creator auto-registered successfully: ', result);
  //           setIsRegistered(true);
  //         } catch (regError) {
  //           console.log('[useDAO] Creator auto-registration failed (might already be registered):', regError);
  //           // If registration fails, creator might already be registered
  //           setIsRegistered(true);
  //         }
  //       } else {
  //         // Regular user, don't check registration automatically
  //         setIsRegistered(false);
  //       }
  //     } else {
  //       setIsRegistered(false);
  //     }
  //   }
  //   autoRegister();
  // }, [daoBe, currentAccount, dao?.creator]);

  // const handleRegister = useCallback(async () => {
  //   console.log('[useDAO] handleRegister called');
    
  //   if (!currentAccount) {
  //     console.error('[useDAO] User not authenticated');
  //     toast.error('Please connect your wallet first');
  //     return;
  //   }
    
  //   if (!daoBe) {
  //     console.error('[useDAO] No canisterId available for registration');
  //     toast.error('DAO not ready for registration');
  //     return;
  //   }
    
  //   setIsRegistering(true);
  //   try {
  //     console.log('[useDAO] Registering user');
  //     const result = await daoBe.register();
  //     console.log('[useDAO] Registration result:', result);
  //     toast.success(result);
      
  //     // Set registration status
  //     setIsRegistered(true);
  //   } catch (err) {
  //     const errorMessage = err instanceof Error ? err.message : 'Registration failed';
  //     console.error('[useDAO] Registration error:', err);
  //     toast.error(errorMessage);
  //   } finally {
  //     setIsRegistering(false);
  //   }
  // }, [daoBe, currentAccount]);

  return {
    daoInfo,
    deploymentInfo,
    isLoading,
    error,
    refetch
  };
};