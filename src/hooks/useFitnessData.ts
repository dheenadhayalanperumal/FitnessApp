import { useState, useEffect, useCallback } from 'react';
import { useSteps } from './useSteps';
import { useWater } from './useWater';
import { useWorkouts } from './useWorkouts';
import { useWeight } from './useWeight';
import { DashboardData, Goals } from '../types';

export const useFitnessData = (userId: string, goals: Goals) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const stepsHook = useSteps(userId);
  const waterHook = useWater(userId);
  const workoutsHook = useWorkouts(userId);
  const weightHook = useWeight(userId);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        stepsHook.loadTodaysSteps(),
        waterHook.loadTodaysWater(),
        workoutsHook.loadWorkouts(),
        weightHook.loadWeightData(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh fitness data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [stepsHook, waterHook, workoutsHook, weightHook]);

  const getDashboardData = useCallback((): DashboardData => {
    return {
      steps: stepsHook.stepsData,
      water: waterHook.waterData,
      diet: null, // This would come from diet hook if implemented
      weight: weightHook.currentWeight,
      recentWorkouts: workoutsHook.getRecentWorkouts(5),
    };
  }, [stepsHook.stepsData, waterHook.waterData, weightHook.currentWeight, workoutsHook]);

  const getWeeklyAnalytics = useCallback(async () => {
    try {
      const [weeklySteps, weeklyWater, weeklyWorkouts, weightTrend] = await Promise.all([
        stepsHook.getWeeklySteps(),
        waterHook.getWeeklyWater(),
        Promise.resolve(workoutsHook.getWeeklyWorkouts()),
        Promise.resolve(weightHook.getWeightTrend(7)),
      ]);

      return {
        steps: weeklySteps,
        water: weeklyWater,
        workouts: weeklyWorkouts,
        weight: weightTrend,
      };
    } catch (error) {
      console.error('Failed to get weekly analytics:', error);
      return {
        steps: [],
        water: [],
        workouts: [],
        weight: [],
      };
    }
  }, [stepsHook, waterHook, workoutsHook, weightHook]);

  const getMonthlyAnalytics = useCallback(async () => {
    try {
      const [monthlySteps, monthlyWorkouts, weightTrend] = await Promise.all([
        stepsHook.getMonthlySteps(),
        Promise.resolve(workoutsHook.getMonthlyWorkouts()),
        Promise.resolve(weightHook.getWeightTrend(30)),
      ]);

      return {
        steps: monthlySteps,
        workouts: monthlyWorkouts,
        weight: weightTrend,
      };
    } catch (error) {
      console.error('Failed to get monthly analytics:', error);
      return {
        steps: [],
        workouts: [],
        weight: [],
      };
    }
  }, [stepsHook, workoutsHook, weightHook]);

  const getOverallStats = useCallback(() => {
    const workoutStats = workoutsHook.getWorkoutStats();
    const weightStats = weightHook.getWeightStats();
    
    const todaysSteps = stepsHook.stepsData?.steps || 0;
    const todaysWater = waterHook.waterData?.amount || 0;
    
    const stepsProgress = (todaysSteps / goals.dailySteps) * 100;
    const waterProgress = (todaysWater / goals.dailyWater) * 100;
    const weeklyWorkoutProgress = (workoutStats.weeklyCount / goals.weeklyWorkouts) * 100;
    
    return {
      steps: {
        today: todaysSteps,
        target: goals.dailySteps,
        progress: Math.min(stepsProgress, 100),
        calories: stepsHook.stepsData?.calories || 0,
        distance: stepsHook.stepsData?.distance || 0,
      },
      water: {
        today: todaysWater,
        target: goals.dailyWater,
        progress: Math.min(waterProgress, 100),
        remaining: Math.max(0, goals.dailyWater - todaysWater),
        entries: waterHook.waterData?.entries?.length || 0,
      },
      workouts: {
        thisWeek: workoutStats.weeklyCount,
        target: goals.weeklyWorkouts,
        progress: Math.min(weeklyWorkoutProgress, 100),
        totalCalories: workoutStats.weeklyCalories,
        totalDuration: workoutStats.weeklyDuration,
        total: workoutStats.totalWorkouts,
      },
      weight: {
        current: weightStats.currentWeight,
        target: goals.targetWeight,
        change7Days: weightStats.weightChange7Days,
        change30Days: weightStats.weightChange30Days,
        totalEntries: weightStats.totalEntries,
      },
      overall: {
        goalsAchieved: [
          stepsProgress >= 100,
          waterProgress >= 100,
          weeklyWorkoutProgress >= 100,
        ].filter(Boolean).length,
        totalGoals: 3,
        completionRate: Math.round(
          ([stepsProgress, waterProgress, weeklyWorkoutProgress]
            .reduce((sum, progress) => sum + Math.min(progress, 100), 0) / 3)
        ),
      },
    };
  }, [
    stepsHook.stepsData,
    waterHook.waterData,
    workoutsHook,
    weightHook,
    goals,
  ]);

  const isAnyLoading = () => {
    return (
      isLoading ||
      stepsHook.isLoading ||
      waterHook.isLoading ||
      workoutsHook.isLoading ||
      weightHook.isLoading
    );
  };

  const getAnyError = () => {
    return (
      stepsHook.error ||
      waterHook.error ||
      workoutsHook.error ||
      weightHook.error
    );
  };

  // Auto-refresh data on mount
  useEffect(() => {
    if (userId) {
      refreshAllData();
    }
  }, [userId, refreshAllData]);

  return {
    // Individual hooks
    steps: stepsHook,
    water: waterHook,
    workouts: workoutsHook,
    weight: weightHook,
    
    // Combined functionality
    refreshAllData,
    getDashboardData,
    getWeeklyAnalytics,
    getMonthlyAnalytics,
    getOverallStats,
    
    // Status
    isLoading: isAnyLoading(),
    error: getAnyError(),
    lastUpdated,
  };
};