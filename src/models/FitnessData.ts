import { StepsData, WaterIntake, DietEntry, WeightEntry, WorkoutEntry, WaterEntry, Meal, Exercise } from '../types';

export class FitnessDataModel {
  static createStepsData(userId: string, steps: number, target: number = 10000): StepsData {
    const date = new Date().toISOString().split('T')[0];
    return {
      id: Date.now().toString(),
      userId,
      date,
      steps,
      target,
      calories: Math.round(steps * 0.04), // Rough calculation
      distance: Math.round(steps * 0.0008 * 100) / 100, // km
      createdAt: new Date(),
    };
  }

  static createWaterIntake(userId: string, target: number = 2000): WaterIntake {
    const date = new Date().toISOString().split('T')[0];
    return {
      id: Date.now().toString(),
      userId,
      date,
      amount: 0,
      target,
      entries: [],
      createdAt: new Date(),
    };
  }

  static addWaterEntry(waterIntake: WaterIntake, amount: number): WaterIntake {
    const entry: WaterEntry = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
    };
    
    return {
      ...waterIntake,
      amount: waterIntake.amount + amount,
      entries: [...waterIntake.entries, entry],
    };
  }

  static createDietEntry(userId: string, targetCalories: number = 2000): DietEntry {
    const date = new Date().toISOString().split('T')[0];
    return {
      id: Date.now().toString(),
      userId,
      date,
      meals: [],
      totalCalories: 0,
      targetCalories,
      createdAt: new Date(),
    };
  }

  static addMeal(dietEntry: DietEntry, meal: Omit<Meal, 'id'>): DietEntry {
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
    };
    
    const updatedMeals = [...dietEntry.meals, newMeal];
    const totalCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
    
    return {
      ...dietEntry,
      meals: updatedMeals,
      totalCalories,
    };
  }

  static createWeightEntry(userId: string, weight: number, notes?: string): WeightEntry {
    const date = new Date().toISOString().split('T')[0];
    return {
      id: Date.now().toString(),
      userId,
      weight,
      date,
      notes,
      createdAt: new Date(),
    };
  }

  static createWorkoutEntry(
    userId: string,
    name: string,
    type: WorkoutEntry['type'],
    duration: number,
    exercises: Exercise[] = []
  ): WorkoutEntry {
    const date = new Date().toISOString().split('T')[0];
    return {
      id: Date.now().toString(),
      userId,
      name,
      type,
      duration,
      calories: this.calculateWorkoutCalories(type, duration),
      exercises,
      date,
      createdAt: new Date(),
    };
  }

  static addExercise(workoutEntry: WorkoutEntry, exercise: Omit<Exercise, 'id'>): WorkoutEntry {
    const newExercise: Exercise = {
      ...exercise,
      id: Date.now().toString(),
    };
    
    return {
      ...workoutEntry,
      exercises: [...workoutEntry.exercises, newExercise],
    };
  }

  private static calculateWorkoutCalories(type: WorkoutEntry['type'], duration: number): number {
    const caloriesPerMinute = {
      cardio: 10,
      strength: 8,
      flexibility: 3,
      sports: 12,
    };
    
    return Math.round(duration * caloriesPerMinute[type]);
  }
}