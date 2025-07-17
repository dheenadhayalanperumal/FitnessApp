import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightEntry } from '../types';
import { FitnessDataModel } from '../models/FitnessData';

export const useWeight = (userId: string) => {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState<WeightEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeightData = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem('weight_entries');
      
      if (data) {
        const entries: WeightEntry[] = JSON.parse(data);
        // Sort by date (newest first)
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setWeightEntries(entries);
        
        // Set current weight as the most recent entry
        if (entries.length > 0) {
          setCurrentWeight(entries[0]);
        }
      }
    } catch (err) {
      setError('Failed to load weight data');
    } finally {
      setIsLoading(false);
    }
  };

  const addWeightEntry = async (weight: number, notes?: string) => {
    try {
      setIsLoading(true);
      const newEntry = FitnessDataModel.createWeightEntry(userId, weight, notes);
      
      const updatedEntries = [newEntry, ...weightEntries];
      await AsyncStorage.setItem('weight_entries', JSON.stringify(updatedEntries));
      
      setWeightEntries(updatedEntries);
      setCurrentWeight(newEntry);
      setError(null);
    } catch (err) {
      setError('Failed to add weight entry');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWeightEntry = async (entryId: string) => {
    try {
      const updatedEntries = weightEntries.filter(entry => entry.id !== entryId);
      await AsyncStorage.setItem('weight_entries', JSON.stringify(updatedEntries));
      
      setWeightEntries(updatedEntries);
      
      // Update current weight
      if (updatedEntries.length > 0) {
        setCurrentWeight(updatedEntries[0]);
      } else {
        setCurrentWeight(null);
      }
    } catch (err) {
      setError('Failed to delete weight entry');
      throw err;
    }
  };

  const updateWeightEntry = async (entryId: string, weight: number, notes?: string) => {
    try {
      const updatedEntries = weightEntries.map(entry => 
        entry.id === entryId 
          ? { ...entry, weight, notes, updatedAt: new Date() }
          : entry
      );
      
      await AsyncStorage.setItem('weight_entries', JSON.stringify(updatedEntries));
      setWeightEntries(updatedEntries);
      
      // Update current weight if it was the current entry
      if (currentWeight && currentWeight.id === entryId) {
        setCurrentWeight({ ...currentWeight, weight, notes });
      }
    } catch (err) {
      setError('Failed to update weight entry');
      throw err;
    }
  };

  const getWeightTrend = (days: number = 30): WeightEntry[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return weightEntries.filter(entry => 
      new Date(entry.date) >= cutoffDate
    ).reverse(); // Oldest first for trend analysis
  };

  const getWeightChange = (days: number = 30): number => {
    const trend = getWeightTrend(days);
    if (trend.length < 2) return 0;
    
    const oldestWeight = trend[0].weight;
    const newestWeight = trend[trend.length - 1].weight;
    
    return newestWeight - oldestWeight;
  };

  const getWeightStats = () => {
    if (weightEntries.length === 0) {
      return {
        currentWeight: 0,
        totalEntries: 0,
        weightChange30Days: 0,
        weightChange7Days: 0,
        averageWeight30Days: 0,
        highestWeight: 0,
        lowestWeight: 0,
      };
    }

    const last30Days = getWeightTrend(30);
    const last7Days = getWeightTrend(7);
    
    const weights = weightEntries.map(entry => entry.weight);
    const avgWeight30Days = last30Days.length > 0 
      ? last30Days.reduce((sum, entry) => sum + entry.weight, 0) / last30Days.length 
      : 0;

    return {
      currentWeight: currentWeight?.weight || 0,
      totalEntries: weightEntries.length,
      weightChange30Days: getWeightChange(30),
      weightChange7Days: getWeightChange(7),
      averageWeight30Days: Math.round(avgWeight30Days * 10) / 10,
      highestWeight: Math.max(...weights),
      lowestWeight: Math.min(...weights),
    };
  };

  const getWeeklyAverages = (): { week: string; average: number }[] => {
    const weeklyData: { [key: string]: number[] } = {};
    
    weightEntries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(entry.weight);
    });
    
    return Object.entries(weeklyData)
      .map(([week, weights]) => ({
        week,
        average: Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 10) / 10,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  };

  useEffect(() => {
    if (userId) {
      loadWeightData();
    }
  }, [userId]);

  return {
    weightEntries,
    currentWeight,
    isLoading,
    error,
    addWeightEntry,
    deleteWeightEntry,
    updateWeightEntry,
    loadWeightData,
    getWeightTrend,
    getWeightChange,
    getWeightStats,
    getWeeklyAverages,
  };
};