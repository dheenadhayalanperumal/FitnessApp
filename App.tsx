import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FirebaseAuthProvider } from './src/context/FirebaseAuthContext';
import { FirebaseFitnessProvider } from './src/context/FirebaseFitnessContext';
import { ErrorProvider } from './src/context/ErrorContext';
import AppNavigator from './src/components/navigation/AppNavigator';
import { deviceStepCounter } from './src/services/deviceStepCounter';

// Global step tracker auto-start component with background handling
const StepTrackerAutoStart = () => {
  useEffect(() => {
    const initializeStepTracker = async () => {
      console.log('🚀 App started - Initializing automatic step tracking...');
      try {
        // Auto-start step tracking immediately when app opens
        const isSupported = await deviceStepCounter.isSupported();
        console.log('📱 Step tracker supported:', isSupported);
        
        if (isSupported) {
          console.log('⚡ Starting background step tracking...');
          const success = await deviceStepCounter.startListening();
          if (success) {
            console.log('✅ Background step tracking active - will count when you move your phone');
          } else {
            console.log('❌ Failed to start background step tracking');
          }
        } else {
          console.log('❌ Device does not support step tracking');
        }
      } catch (error) {
        console.error('❌ Error initializing step tracker:', error);
      }
    };

    // Handle app state changes (simplified - no automatic restart)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed to:', nextAppState);
      // Just log state changes, don't restart automatically
      if (nextAppState === 'background') {
        console.log('📱 App went to background - step tracking continues...');
      } else if (nextAppState === 'active') {
        console.log('📱 App became active - step tracking status:', deviceStepCounter.getIsListening());
      }
    };

    // Start immediately when app loads (only once)
    initializeStepTracker();

    // Listen for app state changes (monitoring only)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorProvider>
          <FirebaseAuthProvider>
            <FirebaseFitnessProvider>
              <StepTrackerAutoStart />
              <AppNavigator />
              <StatusBar style="auto" />
            </FirebaseFitnessProvider>
          </FirebaseAuthProvider>
        </ErrorProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
