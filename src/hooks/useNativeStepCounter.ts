import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { deviceStepCounter, StepCounterData } from '../services/deviceStepCounter';

export interface UseNativeStepCounterReturn {
  steps: number;
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  getTodaySteps: () => Promise<number>;
}

export const useNativeStepCounter = (): UseNativeStepCounterReturn => {
  const [steps, setSteps] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(deviceStepCounter.isSupportedSync());

  // Check full async support on mount
  useEffect(() => {
    const checkAsyncSupport = async () => {
      try {
        console.log('🔍 Checking async device support...');
        const asyncSupported = await deviceStepCounter.isSupported();
        console.log('📱 Async support result:', asyncSupported);
        setIsSupported(asyncSupported);
      } catch (error) {
        console.error('❌ Error checking async support:', error);
        setIsSupported(false);
      }
    };
    
    checkAsyncSupport();
  }, []);

  // Step counter callback
  const handleStepUpdate = useCallback((data: StepCounterData) => {
    setSteps(data.dailySteps);
    setError(null);
  }, []);

  // Start tracking steps
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Native step counter not supported on this device');
      return false;
    }

    try {
      setError(null);
      
      // Add listener before starting
      deviceStepCounter.addListener(handleStepUpdate);
      
      // Try to start device step counter
      const success = await deviceStepCounter.startListening();
      
      if (success) {
        setIsListening(true);
        
        // Get initial step count
        try {
          const initialSteps = await deviceStepCounter.getTodaySteps();
          setSteps(initialSteps);
        } catch (error) {
          console.log('Could not get initial steps, using 0');
          setSteps(0);
        }
        
        return true;
      } else {
        setError('Device step counter not available');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    }
  }, [isSupported, handleStepUpdate]);

  // Stop tracking steps
  const stopTracking = useCallback(async (): Promise<void> => {
    try {
      await deviceStepCounter.stopListening();
      deviceStepCounter.removeListener(handleStepUpdate);
      setIsListening(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop tracking';
      setError(errorMessage);
    }
  }, [handleStepUpdate]);

  // Get today's steps
  const getTodaySteps = useCallback(async (): Promise<number> => {
    if (!isSupported) {
      return 0;
    }

    try {
      const todaySteps = await deviceStepCounter.getTodaySteps();
      setSteps(todaySteps);
      setError(null);
      return todaySteps;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get today steps';
      console.log('getTodaySteps error:', errorMessage);
      setError(errorMessage);
      return 0;
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopTracking();
      }
    };
  }, [isListening, stopTracking]);

  // Auto-start tracking immediately when app loads (only once)
  useEffect(() => {
    if (isSupported && !isListening && !error) {
      console.log('🚀 Immediately auto-starting step tracking...');
      // Start immediately for automatic background tracking
      const startImmediately = async () => {
        try {
          console.log('⚡ Starting step tracking now...');
          const success = await startTracking();
          console.log('📊 Immediate auto-start result:', success);
          if (success) {
            console.log('✅ Step tracking is now active in background');
          }
        } catch (error) {
          console.error('❌ Failed to auto-start step tracking:', error);
          setError('Failed to start step tracking');
        }
      };
      
      startImmediately();
    } else {
      console.log('ℹ️ Auto-start conditions:', { isSupported, isListening, error: error || 'none' });
    }
  }, [isSupported]); // Only depend on isSupported to prevent loops

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 Step counter state:', {
      steps,
      isSupported,
      isListening,
      error: error || 'none'
    });
  }, [steps, isSupported, isListening, error]);

  return {
    steps,
    isSupported,
    isListening,
    error,
    startTracking,
    stopTracking,
    getTodaySteps,
  };
};