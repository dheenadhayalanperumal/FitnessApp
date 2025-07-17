import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepsData } from '../types';
import { FitnessDataModel } from '../models/FitnessData';

export const useSteps = (userId: string) => {
  const [stepsData, setStepsData] = useState<StepsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const loadTodaysSteps = async () => {
    try {
      setIsLoading(true);
      const todayKey = getTodayKey();
      const data = await AsyncStorage.getItem(`steps_${todayKey}`);
      
      if (data) {
        setStepsData(JSON.parse(data));
      } else {
        // Initialize with 0 steps for today
        const newStepsData = FitnessDataModel.createStepsData(userId, 0);
        setStepsData(newStepsData);
      }
    } catch (err) {
      setError('Failed to load steps data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSteps = async (steps: number, target: number = 10000) => {
    try {
      setIsLoading(true);
      const newStepsData = FitnessDataModel.createStepsData(userId, steps, target);
      const todayKey = getTodayKey();
      
      await AsyncStorage.setItem(`steps_${todayKey}`, JSON.stringify(newStepsData));
      setStepsData(newStepsData);
      setError(null);
    } catch (err) {
      setError('Failed to update steps');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getWeeklySteps = async (): Promise<StepsData[]> => {
    try {
      const weeklyData: StepsData[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const data = await AsyncStorage.getItem(`steps_${dateKey}`);
        if (data) {
          weeklyData.push(JSON.parse(data));
        } else {
          // Create empty data for missing days
          weeklyData.push(FitnessDataModel.createStepsData(userId, 0, 10000));
        }
      }
      
      return weeklyData;
    } catch (err) {
      setError('Failed to load weekly steps');
      return [];
    }
  };

  const getMonthlySteps = async (): Promise<StepsData[]> => {
    try {
      const monthlyData: StepsData[] = [];
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      for (let date = new Date(firstDayOfMonth); date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
        const dateKey = date.toISOString().split('T')[0];
        const data = await AsyncStorage.getItem(`steps_${dateKey}`);
        
        if (data) {
          monthlyData.push(JSON.parse(data));
        }
      }
      
      return monthlyData;
    } catch (err) {
      setError('Failed to load monthly steps');
      return [];
    }
  };

  useEffect(() => {
    if (userId) {
      loadTodaysSteps();
    }
  }, [userId]);

  return {
    stepsData,
    isLoading,
    error,
    updateSteps,
    loadTodaysSteps,
    getWeeklySteps,
    getMonthlySteps,
  };
};