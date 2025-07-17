import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { ErrorHandlingService } from '../services/errorHandlingService';
// ErrorMonitoringService disabled for clean user experience
// import { ErrorMonitoringService } from '../services/errorMonitoringService';
import { NetworkService } from '../services/networkService';

interface ErrorContextType {
  reportError: (error: Error, context?: string) => void;
  showError: (error: Error, onRetry?: () => void) => void;
  addBreadcrumb: (message: string, level?: 'debug' | 'info' | 'warning' | 'error', category?: string) => void;
  isOnline: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorHandler = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(NetworkService.isOnline());

  useEffect(() => {
    // Set up network listener
    const unsubscribe = NetworkService.addListener((state) => {
      setIsOnline(state.isConnected && state.isReachable);
    });

    // Start network queue processor
    NetworkService.startQueueProcessor();

    return unsubscribe;
  }, []);

  const reportError = (error: Error, context?: string) => {
    // Error monitoring disabled for clean user experience
  };

  const showError = (error: Error, onRetry?: () => void) => {
    const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'ErrorContext');
    ErrorHandlingService.showErrorAlert(errorInfo, onRetry);
  };

  const addBreadcrumb = (
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    category: string = 'general'
  ) => {
    // Error monitoring disabled for clean user experience
  };

  const value: ErrorContextType = {
    reportError,
    showError,
    addBreadcrumb,
    isOnline,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};