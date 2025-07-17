import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { StepsData, WaterIntake, DietEntry, WeightEntry, WorkoutEntry, DashboardData, Goals } from '../types';
import { FitnessDataModel } from '../models/FitnessData';
import { UserModel } from '../models/User';
import { FirestoreService } from '../services/firestoreService';
import { FirestoreErrorHandler } from '../services/firestoreErrorHandler';
// ErrorMonitoringService disabled for clean user experience
// import { ErrorMonitoringService } from '../services/errorMonitoringService';
import { useFirebaseAuth } from './FirebaseAuthContext';

interface FirebaseFitnessState {
  steps: StepsData | null;
  water: WaterIntake | null;
  diet: DietEntry | null;
  weight: WeightEntry | null;
  workouts: WorkoutEntry[];
  goals: Goals;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

type FirebaseFitnessAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_STEPS'; payload: StepsData }
  | { type: 'SET_WATER'; payload: WaterIntake }
  | { type: 'SET_DIET'; payload: DietEntry }
  | { type: 'SET_WEIGHT'; payload: WeightEntry }
  | { type: 'SET_WORKOUTS'; payload: WorkoutEntry[] }
  | { type: 'ADD_WORKOUT'; payload: WorkoutEntry }
  | { type: 'SET_GOALS'; payload: Goals }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'RESET_DATA' };

const fitnessReducer = (state: FirebaseFitnessState, action: FirebaseFitnessAction): FirebaseFitnessState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_STEPS':
      return { ...state, steps: action.payload };
    case 'SET_WATER':
      return { ...state, water: action.payload };
    case 'SET_DIET':
      return { ...state, diet: action.payload };
    case 'SET_WEIGHT':
      return { ...state, weight: action.payload };
    case 'SET_WORKOUTS':
      return { ...state, workouts: action.payload };
    case 'ADD_WORKOUT':
      return { ...state, workouts: [action.payload, ...state.workouts] };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    case 'RESET_DATA':
      return {
        ...state,
        steps: null,
        water: null,
        diet: null,
        weight: null,
        workouts: [],
      };
    default:
      return state;
  }
};

const initialState: FirebaseFitnessState = {
  steps: null,
  water: null,
  diet: null,
  weight: null,
  workouts: [],
  goals: UserModel.getDefaultGoals(),
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null,
};

interface FirebaseFitnessContextType {
  state: FirebaseFitnessState;
  updateSteps: (steps: number) => Promise<void>;
  addWaterIntake: (amount: number) => Promise<void>;
  addMeal: (meal: Omit<any, 'id'>) => Promise<void>;
  addWeightEntry: (weight: number, notes?: string) => Promise<void>;
  addWorkout: (workout: Omit<WorkoutEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateGoals: (goals: Goals) => Promise<void>;
  loadTodaysData: (userId: string) => Promise<void>;
  getDashboardData: () => DashboardData;
  syncData: () => Promise<void>;
  enableRealTimeSync: () => void;
  disableRealTimeSync: () => void;
}

const FirebaseFitnessContext = createContext<FirebaseFitnessContextType | undefined>(undefined);

export const useFirebaseFitness = () => {
  const context = useContext(FirebaseFitnessContext);
  if (!context) {
    throw new Error('useFirebaseFitness must be used within a FirebaseFitnessProvider');
  }
  return context;
};

interface FirebaseFitnessProviderProps {
  children: ReactNode;
}

export const FirebaseFitnessProvider: React.FC<FirebaseFitnessProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fitnessReducer, initialState);
  const { user, isAuthenticated } = useFirebaseAuth();
  
  // Real-time listeners cleanup functions
  const [unsubscribeFunctions, setUnsubscribeFunctions] = React.useState<(() => void)[]>([]);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const updateSteps = async (steps: number) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      const stepsData = FitnessDataModel.createStepsData(user.id, steps, state.goals.dailySteps);
      await FirestoreService.saveStepsData(user.id, stepsData);
      
      dispatch({ type: 'SET_STEPS', payload: stepsData });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error updating steps:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const addWaterIntake = async (amount: number) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      let currentWater = state.water;
      if (!currentWater) {
        currentWater = FitnessDataModel.createWaterIntake(user.id, state.goals.dailyWater);
      }
      
      const updatedWater = FitnessDataModel.addWaterEntry(currentWater, amount);
      await FirestoreService.saveWaterIntake(user.id, updatedWater);
      
      dispatch({ type: 'SET_WATER', payload: updatedWater });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error adding water intake:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const addMeal = async (meal: Omit<any, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      let currentDiet = state.diet;
      if (!currentDiet) {
        currentDiet = FitnessDataModel.createDietEntry(user.id, state.goals.dailyCalories);
      }
      
      const updatedDiet = FitnessDataModel.addMeal(currentDiet, meal);
      await FirestoreService.saveDietEntry(user.id, updatedDiet);
      
      dispatch({ type: 'SET_DIET', payload: updatedDiet });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const addWeightEntry = async (weight: number, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      const weightEntry = FitnessDataModel.createWeightEntry(user.id, weight, notes);
      await FirestoreService.addWeightEntry(user.id, weightEntry);
      
      dispatch({ type: 'SET_WEIGHT', payload: weightEntry });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error adding weight entry:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const addWorkout = async (workout: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      const workoutEntry = FitnessDataModel.createWorkoutEntry(
        user.id,
        workout.name,
        workout.type,
        workout.duration,
        workout.exercises
      );
      
      if (workout.notes) {
        workoutEntry.notes = workout.notes;
      }
      
      const workoutId = await FirestoreService.addWorkoutEntry(user.id, workoutEntry);
      workoutEntry.id = workoutId;
      
      dispatch({ type: 'ADD_WORKOUT', payload: workoutEntry });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error adding workout:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const updateGoals = async (goals: Goals) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      await FirestoreService.saveUserGoals(user.id, goals);
      dispatch({ type: 'SET_GOALS', payload: goals });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error updating goals:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const loadTodaysData = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const todayKey = getTodayKey();
      
      const [stepsData, waterData, dietData, workoutData, goalsData] = await Promise.all([
        FirestoreService.getStepsData(userId, todayKey),
        FirestoreService.getWaterIntake(userId, todayKey),
        FirestoreService.getDietEntry(userId, todayKey),
        FirestoreService.getWorkoutEntries(userId, 50),
        FirestoreService.getUserGoals(userId),
      ]);
      
      if (stepsData) dispatch({ type: 'SET_STEPS', payload: stepsData });
      if (waterData) dispatch({ type: 'SET_WATER', payload: waterData });
      if (dietData) dispatch({ type: 'SET_DIET', payload: dietData });
      if (workoutData) dispatch({ type: 'SET_WORKOUTS', payload: workoutData });
      if (goalsData) dispatch({ type: 'SET_GOALS', payload: goalsData });
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Error loading fitness data:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncData = async () => {
    if (!user) return;
    
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      await loadTodaysData(user.id);
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const enableRealTimeSync = async () => {
    if (!user) return;
    
    try {
      // Add a small delay to ensure authentication is fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if Firestore rules are properly configured
      const rulesOk = await FirestoreErrorHandler.checkFirestoreRules();
      if (!rulesOk) {
        console.error('Firestore rules not properly configured. Please deploy security rules.');
        // Error monitoring disabled for clean user experience
        return;
      }
      
      const todayKey = getTodayKey();
      
      const unsubscribeSteps = FirestoreService.subscribeToStepsData(
        user.id,
        todayKey,
        (data) => {
          if (data) dispatch({ type: 'SET_STEPS', payload: data });
        }
      );
      
      const unsubscribeWater = FirestoreService.subscribeToWaterIntake(
        user.id,
        todayKey,
        (data) => {
          if (data) dispatch({ type: 'SET_WATER', payload: data });
        }
      );
      
      const unsubscribeWorkouts = FirestoreService.subscribeToWorkouts(
        user.id,
        (workouts) => {
          dispatch({ type: 'SET_WORKOUTS', payload: workouts });
        }
      );
      
      setUnsubscribeFunctions([unsubscribeSteps, unsubscribeWater, unsubscribeWorkouts]);
      
      // Error monitoring disabled for clean user experience
    } catch (error: any) {
      console.error('Error enabling real-time sync:', error);
      // Error monitoring disabled for clean user experience
    }
  };

  const disableRealTimeSync = () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    setUnsubscribeFunctions([]);
  };

  const getDashboardData = (): DashboardData => {
    return {
      steps: state.steps,
      water: state.water,
      diet: state.diet,
      weight: state.weight,
      recentWorkouts: state.workouts.slice(0, 5),
    };
  };

  // Load data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTodaysData(user.id);
      enableRealTimeSync();
    } else {
      dispatch({ type: 'RESET_DATA' });
      disableRealTimeSync();
    }
    
    // Cleanup listeners on unmount
    return () => {
      disableRealTimeSync();
    };
  }, [isAuthenticated, user]);

  const value: FirebaseFitnessContextType = {
    state,
    updateSteps,
    addWaterIntake,
    addMeal,
    addWeightEntry,
    addWorkout,
    updateGoals,
    loadTodaysData,
    getDashboardData,
    syncData,
    enableRealTimeSync,
    disableRealTimeSync,
  };

  return (
    <FirebaseFitnessContext.Provider value={value}>
      {children}
    </FirebaseFitnessContext.Provider>
  );
};