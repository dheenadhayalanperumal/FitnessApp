import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FirebaseAuthProvider } from './src/context/FirebaseAuthContext';
import { FirebaseFitnessProvider } from './src/context/FirebaseFitnessContext';
import { ErrorProvider } from './src/context/ErrorContext';
import AppNavigator from './src/components/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorProvider>
        <FirebaseAuthProvider>
          <FirebaseFitnessProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </FirebaseFitnessProvider>
        </FirebaseAuthProvider>
      </ErrorProvider>
    </GestureHandlerRootView>
  );
}
