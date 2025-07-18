import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { AuthService } from '../services/authService';
import { ErrorHandlingService } from '../services/errorHandlingService';
// ErrorMonitoringService import disabled for clean user experience
// import { ErrorMonitoringService } from '../services/errorMonitoringService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  const nextState = (() => {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
      case 'SET_USER':
        // Error monitoring disabled for clean user experience
        return { 
          ...state, 
          user: action.payload,
          isAuthenticated: !!action.payload,
          isInitialized: true,
        };
      case 'SET_INITIALIZED':
        return { ...state, isInitialized: action.payload };
      case 'LOGOUT':
        // Error monitoring disabled for clean user experience
        return { 
          ...state, 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        };
      default:
        return state;
    }
  })();
  console.log('[authReducer]', action.type, '->', nextState);
  return nextState;
};

const initialState: AuthState = {
  user: null,
  isLoading: false, // Start as false for login/register
  isAuthenticated: false,
  isInitialized: false, // New: for initial auth check
};

const FirebaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Set up authentication state listener for initial load only
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_INITIALIZED', payload: true }); // Mark initial check as done
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    console.log('FirebaseAuthContext login called', { email, password });
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const user = await ErrorHandlingService.retryWithBackoff(
        () => AuthService.login(email, password),
        3, // max retries
        1000 // initial delay
      );
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      console.log('login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const user = await ErrorHandlingService.retryWithBackoff(
        () => AuthService.register(name, email, password),
        2, // max retries for registration
        1000 // initial delay
      );
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await AuthService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      // Even if logout fails on server, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await ErrorHandlingService.retryWithBackoff(
        () => AuthService.resetPassword(email),
        3, // max retries
        1000 // initial delay
      );
    } catch (error: any) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!state.user) {
        throw new Error('No authenticated user');
      }

      await AuthService.updateUserProfile(updates);
      
      // Update local state
      const updatedUser = { ...state.user, ...updates };
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const value: AuthContextType & {
    isInitialized: boolean;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
  } = {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isInitialized: state.isInitialized, // Expose new state
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};