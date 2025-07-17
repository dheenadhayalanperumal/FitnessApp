import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterIntake } from '../types';
import { FitnessDataModel } from '../models/FitnessData';

export const useWater = (userId: string) => {
  const [waterData, setWaterData] = useState<WaterIntake | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const loadTodaysWater = async () => {
    try {
      setIsLoading(true);
      const todayKey = getTodayKey();
      const data = await AsyncStorage.getItem(`water_${todayKey}`);
      
      if (data) {
        setWaterData(JSON.parse(data));
      } else {
        // Initialize with 0 water for today
        const newWaterData = FitnessDataModel.createWaterIntake(userId);
        setWaterData(newWaterData);
      }
    } catch (err) {
      setError('Failed to load water data');
    } finally {
      setIsLoading(false);
    }
  };

  const addWaterIntake = async (amount: number) => {
    try {
      setIsLoading(true);
      let currentWater = waterData;
      
      if (!currentWater) {
        currentWater = FitnessDataModel.createWaterIntake(userId);
      }
      
      const updatedWater = FitnessDataModel.addWaterEntry(currentWater, amount);
      const todayKey = getTodayKey();
      
      await AsyncStorage.setItem(`water_${todayKey}`, JSON.stringify(updatedWater));
      setWaterData(updatedWater);
      setError(null);
    } catch (err) {
      setError('Failed to add water intake');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getWeeklyWater = async (): Promise<WaterIntake[]> => {
    try {
      const weeklyData: WaterIntake[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const data = await AsyncStorage.getItem(`water_${dateKey}`);
        if (data) {
          weeklyData.push(JSON.parse(data));
        } else {
          // Create empty data for missing days
          weeklyData.push(FitnessDataModel.createWaterIntake(userId));
        }
      }
      
      return weeklyData;
    } catch (err) {
      setError('Failed to load weekly water data');
      return [];
    }
  };

  const updateTarget = async (newTarget: number) => {
    try {
      if (waterData) {
        const updatedWater = { ...waterData, target: newTarget };
        const todayKey = getTodayKey();
        
        await AsyncStorage.setItem(`water_${todayKey}`, JSON.stringify(updatedWater));
        setWaterData(updatedWater);
      }
    } catch (err) {
      setError('Failed to update water target');
      throw err;
    }
  };

  const getTodaysProgress = () => {
    if (!waterData) return 0;
    return (waterData.amount / waterData.target) * 100;
  };

  const getRemainingAmount = () => {
    if (!waterData) return 0;
    return Math.max(0, waterData.target - waterData.amount);
  };

  useEffect(() => {
    if (userId) {
      loadTodaysWater();
    }
  }, [userId]);

  return {
    waterData,
    isLoading,
    error,
    addWaterIntake,
    loadTodaysWater,
    getWeeklyWater,
    updateTarget,
    getTodaysProgress,
    getRemainingAmount,
  };
};