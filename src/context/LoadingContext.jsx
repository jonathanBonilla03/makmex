import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [activeRequests, setActiveRequests] = useState(0);

  const startLoading = useCallback(() => {
    setActiveRequests((count) => count + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setActiveRequests((count) => (count > 0 ? count - 1 : 0));
  }, []);

  const value = useMemo(
    () => ({
      activeRequests,
      isLoading: activeRequests > 0,
      startLoading,
      stopLoading
    }),
    [activeRequests, startLoading, stopLoading]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoadingStatus() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingStatus must be used within a LoadingProvider');
  }
  return context;
}
