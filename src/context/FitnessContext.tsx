import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepsData, WaterIntake, DietEntry, WeightEntry, WorkoutEntry, DashboardData, Goals } from '../types';
import { FitnessDataModel } from '../models/FitnessData';
import { UserModel } from '../models/User';

interface FitnessState {
  steps: StepsData | null;
  water: WaterIntake | null;
  diet: DietEntry | null;
  weight: WeightEntry | null;
  workouts: WorkoutEntry[];
  goals: Goals;
  isLoading: boolean;
}

type FitnessAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STEPS'; payload: StepsData }
  | { type: 'SET_WATER'; payload: WaterIntake }
  | { type: 'SET_DIET'; payload: DietEntry }
  | { type: 'SET_WEIGHT'; payload: WeightEntry }
  | { type: 'SET_WORKOUTS'; payload: WorkoutEntry[] }
  | { type: 'ADD_WORKOUT'; payload: WorkoutEntry }
  | { type: 'SET_GOALS'; payload: Goals }
  | { type: 'RESET_DATA' };

const fitnessReducer = (state: FitnessState, action: FitnessAction): FitnessState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
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

const initialState: FitnessState = {
  steps: null,
  water: null,
  diet: null,
  weight: null,
  workouts: [],
  goals: UserModel.getDefaultGoals(),
  isLoading: false,
};

interface FitnessContextType {
  state: FitnessState;
  updateSteps: (steps: number) => Promise<void>;
  addWaterIntake: (amount: number) => Promise<void>;
  addMeal: (meal: Omit<any, 'id'>) => Promise<void>;
  addWeightEntry: (weight: number, notes?: string) => Promise<void>;
  addWorkout: (workout: Omit<WorkoutEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateGoals: (goals: Goals) => Promise<void>;
  loadTodaysData: (userId: string) => Promise<void>;
  getDashboardData: () => DashboardData;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};

interface FitnessProviderProps {
  children: ReactNode;
}

export const FitnessProvider: React.FC<FitnessProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fitnessReducer, initialState);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const updateSteps = async (steps: number) => {
    try {
      const userId = 'current-user'; // Replace with actual user ID
      const stepsData = FitnessDataModel.createStepsData(userId, steps, state.goals.dailySteps);
      
      await AsyncStorage.setItem(`steps_${getTodayKey()}`, JSON.stringify(stepsData));
      dispatch({ type: 'SET_STEPS', payload: stepsData });
    } catch (error) {
      console.error('Error updating steps:', error);
    }
  };

  const addWaterIntake = async (amount: number) => {
    try {
      const userId = 'current-user';
      let currentWater = state.water;
      
      if (!currentWater) {
        currentWater = FitnessDataModel.createWaterIntake(userId, state.goals.dailyWater);
      }
      
      const updatedWater = FitnessDataModel.addWaterEntry(currentWater, amount);
      
      await AsyncStorage.setItem(`water_${getTodayKey()}`, JSON.stringify(updatedWater));
      dispatch({ type: 'SET_WATER', payload: updatedWater });
    } catch (error) {
      console.error('Error adding water intake:', error);
    }
  };

  const addMeal = async (meal: Omit<any, 'id'>) => {
    try {
      const userId = 'current-user';
      let currentDiet = state.diet;
      
      if (!currentDiet) {
        currentDiet = FitnessDataModel.createDietEntry(userId, state.goals.dailyCalories);
      }
      
      const updatedDiet = FitnessDataModel.addMeal(currentDiet, meal);
      
      await AsyncStorage.setItem(`diet_${getTodayKey()}`, JSON.stringify(updatedDiet));
      dispatch({ type: 'SET_DIET', payload: updatedDiet });
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const addWeightEntry = async (weight: number, notes?: string) => {
    try {
      const userId = 'current-user';
      const weightEntry = FitnessDataModel.createWeightEntry(userId, weight, notes);
      
      await AsyncStorage.setItem(`weight_${getTodayKey()}`, JSON.stringify(weightEntry));
      dispatch({ type: 'SET_WEIGHT', payload: weightEntry });
    } catch (error) {
      console.error('Error adding weight entry:', error);
    }
  };

  const addWorkout = async (workout: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    try {
      const userId = 'current-user';
      const workoutEntry = FitnessDataModel.createWorkoutEntry(
        userId,
        workout.name,
        workout.type,
        workout.duration,
        workout.exercises
      );
      
      const updatedWorkouts = [workoutEntry, ...state.workouts];
      await AsyncStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      dispatch({ type: 'ADD_WORKOUT', payload: workoutEntry });
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  const updateGoals = async (goals: Goals) => {
    try {
      await AsyncStorage.setItem('goals', JSON.stringify(goals));
      dispatch({ type: 'SET_GOALS', payload: goals });
    } catch (error) {
      console.error('Error updating goals:', error);
    }
  };

  const loadTodaysData = async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const todayKey = getTodayKey();
      
      // Load today's data
      const [stepsData, waterData, dietData, weightData, workoutsData, goalsData] = await Promise.all([
        AsyncStorage.getItem(`steps_${todayKey}`),
        AsyncStorage.getItem(`water_${todayKey}`),
        AsyncStorage.getItem(`diet_${todayKey}`),
        AsyncStorage.getItem(`weight_${todayKey}`),
        AsyncStorage.getItem('workouts'),
        AsyncStorage.getItem('goals'),
      ]);
      
      if (stepsData) {
        dispatch({ type: 'SET_STEPS', payload: JSON.parse(stepsData) });
      }
      
      if (waterData) {
        dispatch({ type: 'SET_WATER', payload: JSON.parse(waterData) });
      }
      
      if (dietData) {
        dispatch({ type: 'SET_DIET', payload: JSON.parse(dietData) });
      }
      
      if (weightData) {
        dispatch({ type: 'SET_WEIGHT', payload: JSON.parse(weightData) });
      }
      
      if (workoutsData) {
        dispatch({ type: 'SET_WORKOUTS', payload: JSON.parse(workoutsData) });
      }
      
      if (goalsData) {
        dispatch({ type: 'SET_GOALS', payload: JSON.parse(goalsData) });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error loading fitness data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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

  const value: FitnessContextType = {
    state,
    updateSteps,
    addWaterIntake,
    addMeal,
    addWeightEntry,
    addWorkout,
    updateGoals,
    loadTodaysData,
    getDashboardData,
  };

  return (
    <FitnessContext.Provider value={value}>
      {children}
    </FitnessContext.Provider>
  );
};