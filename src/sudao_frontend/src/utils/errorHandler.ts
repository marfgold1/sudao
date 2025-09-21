export const handleCertificateError = (error: any) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Invalid certificate: Signature verification failed')) {
    console.log('[ErrorHandler] Certificate error detected, reloading page...');
    window.location.reload();
    return true;
  }
  
  return false;
};

export const withCertificateErrorHandling = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (handleCertificateError(error)) {
      throw new Error('Page reloading due to certificate error');
    }
    throw error;
  }
};