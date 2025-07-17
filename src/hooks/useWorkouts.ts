import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutEntry } from '../types';
import { FitnessDataModel } from '../models/FitnessData';

export const useWorkouts = (userId: string) => {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem('workouts');
      
      if (data) {
        const workoutList: WorkoutEntry[] = JSON.parse(data);
        // Sort by date (newest first)
        workoutList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWorkouts(workoutList);
      }
    } catch (err) {
      setError('Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  const addWorkout = async (workout: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newWorkout = FitnessDataModel.createWorkoutEntry(
        userId,
        workout.name,
        workout.type,
        workout.duration,
        workout.exercises || []
      );

      if (workout.notes) {
        newWorkout.notes = workout.notes;
      }

      const updatedWorkouts = [newWorkout, ...workouts];
      await AsyncStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
      setError(null);
    } catch (err) {
      setError('Failed to add workout');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
      await AsyncStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
    } catch (err) {
      setError('Failed to delete workout');
      throw err;
    }
  };

  const updateWorkout = async (workoutId: string, updates: Partial<WorkoutEntry>) => {
    try {
      const updatedWorkouts = workouts.map(workout => 
        workout.id === workoutId ? { ...workout, ...updates } : workout
      );
      await AsyncStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
    } catch (err) {
      setError('Failed to update workout');
      throw err;
    }
  };

  const getRecentWorkouts = (limit: number = 5): WorkoutEntry[] => {
    return workouts.slice(0, limit);
  };

  const getWorkoutsByType = (type: WorkoutEntry['type']): WorkoutEntry[] => {
    return workouts.filter(workout => workout.type === type);
  };

  const getWorkoutsByDateRange = (startDate: Date, endDate: Date): WorkoutEntry[] => {
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startDate && workoutDate <= endDate;
    });
  };

  const getWeeklyWorkouts = (): WorkoutEntry[] => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    
    return getWorkoutsByDateRange(weekStart, today);
  };

  const getMonthlyWorkouts = (): WorkoutEntry[] => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return getWorkoutsByDateRange(monthStart, today);
  };

  const getTotalCaloriesBurned = (workouts: WorkoutEntry[]): number => {
    return workouts.reduce((total, workout) => total + workout.calories, 0);
  };

  const getTotalWorkoutTime = (workouts: WorkoutEntry[]): number => {
    return workouts.reduce((total, workout) => total + workout.duration, 0);
  };

  const getWorkoutStats = () => {
    const weeklyWorkouts = getWeeklyWorkouts();
    const monthlyWorkouts = getMonthlyWorkouts();
    
    return {
      totalWorkouts: workouts.length,
      weeklyCount: weeklyWorkouts.length,
      monthlyCount: monthlyWorkouts.length,
      weeklyCalories: getTotalCaloriesBurned(weeklyWorkouts),
      monthlyCalories: getTotalCaloriesBurned(monthlyWorkouts),
      weeklyDuration: getTotalWorkoutTime(weeklyWorkouts),
      monthlyDuration: getTotalWorkoutTime(monthlyWorkouts),
    };
  };

  useEffect(() => {
    if (userId) {
      loadWorkouts();
    }
  }, [userId]);

  return {
    workouts,
    isLoading,
    error,
    addWorkout,
    deleteWorkout,
    updateWorkout,
    loadWorkouts,
    getRecentWorkouts,
    getWorkoutsByType,
    getWorkoutsByDateRange,
    getWeeklyWorkouts,
    getMonthlyWorkouts,
    getWorkoutStats,
  };
};