import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirestoreService } from './firestoreService';
import { 
  StepsData, 
  WaterIntake, 
  DietEntry, 
  WeightEntry, 
  WorkoutEntry, 
  Goals 
} from '../types';

export class DataMigrationService {
  static async migrateUserData(userId: string): Promise<{
    success: boolean;
    migratedItems: string[];
    errors: string[];
  }> {
    const migratedItems: string[] = [];
    const errors: string[] = [];

    try {
      // Migrate user goals
      try {
        const goalsData = await AsyncStorage.getItem('goals');
        if (goalsData) {
          const goals: Goals = JSON.parse(goalsData);
          await FirestoreService.saveUserGoals(userId, goals);
          migratedItems.push('User Goals');
        }
      } catch (error) {
        errors.push(`Goals migration failed: ${error}`);
      }

      // Migrate steps data (last 30 days)
      try {
        await this.migrateStepsData(userId, migratedItems, errors);
      } catch (error) {
        errors.push(`Steps migration failed: ${error}`);
      }

      // Migrate water data (last 30 days)
      try {
        await this.migrateWaterData(userId, migratedItems, errors);
      } catch (error) {
        errors.push(`Water migration failed: ${error}`);
      }

      // Migrate diet data (last 30 days)
      try {
        await this.migrateDietData(userId, migratedItems, errors);
      } catch (error) {
        errors.push(`Diet migration failed: ${error}`);
      }

      // Migrate weight entries
      try {
        const weightData = await AsyncStorage.getItem('weight_entries');
        if (weightData) {
          const weightEntries: WeightEntry[] = JSON.parse(weightData);
          
          for (const entry of weightEntries) {
            await FirestoreService.addWeightEntry(userId, entry);
          }
          
          migratedItems.push(`${weightEntries.length} Weight Entries`);
        }
      } catch (error) {
        errors.push(`Weight entries migration failed: ${error}`);
      }

      // Migrate workout entries
      try {
        const workoutData = await AsyncStorage.getItem('workouts');
        if (workoutData) {
          const workouts: WorkoutEntry[] = JSON.parse(workoutData);
          
          for (const workout of workouts) {
            await FirestoreService.addWorkoutEntry(userId, workout);
          }
          
          migratedItems.push(`${workouts.length} Workout Entries`);
        }
      } catch (error) {
        errors.push(`Workout entries migration failed: ${error}`);
      }

      return {
        success: errors.length === 0,
        migratedItems,
        errors,
      };
    } catch (error) {
      errors.push(`General migration error: ${error}`);
      return {
        success: false,
        migratedItems,
        errors,
      };
    }
  }

  private static async migrateStepsData(
    userId: string, 
    migratedItems: string[], 
    errors: string[]
  ): Promise<void> {
    const today = new Date();
    let migratedCount = 0;

    // Migrate last 30 days of steps data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      try {
        const stepsData = await AsyncStorage.getItem(`steps_${dateKey}`);
        if (stepsData) {
          const steps: StepsData = JSON.parse(stepsData);
          await FirestoreService.saveStepsData(userId, steps);
          migratedCount++;
        }
      } catch (error) {
        errors.push(`Steps data for ${dateKey} failed: ${error}`);
      }
    }

    if (migratedCount > 0) {
      migratedItems.push(`${migratedCount} Days of Steps Data`);
    }
  }

  private static async migrateWaterData(
    userId: string, 
    migratedItems: string[], 
    errors: string[]
  ): Promise<void> {
    const today = new Date();
    let migratedCount = 0;

    // Migrate last 30 days of water data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      try {
        const waterData = await AsyncStorage.getItem(`water_${dateKey}`);
        if (waterData) {
          const water: WaterIntake = JSON.parse(waterData);
          await FirestoreService.saveWaterIntake(userId, water);
          migratedCount++;
        }
      } catch (error) {
        errors.push(`Water data for ${dateKey} failed: ${error}`);
      }
    }

    if (migratedCount > 0) {
      migratedItems.push(`${migratedCount} Days of Water Data`);
    }
  }

  private static async migrateDietData(
    userId: string, 
    migratedItems: string[], 
    errors: string[]
  ): Promise<void> {
    const today = new Date();
    let migratedCount = 0;

    // Migrate last 30 days of diet data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      try {
        const dietData = await AsyncStorage.getItem(`diet_${dateKey}`);
        if (dietData) {
          const diet: DietEntry = JSON.parse(dietData);
          await FirestoreService.saveDietEntry(userId, diet);
          migratedCount++;
        }
      } catch (error) {
        errors.push(`Diet data for ${dateKey} failed: ${error}`);
      }
    }

    if (migratedCount > 0) {
      migratedItems.push(`${migratedCount} Days of Diet Data`);
    }
  }

  static async clearAsyncStorageData(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter fitness-related keys (but keep user session data)
      const fitnessKeys = keys.filter(key => 
        key.startsWith('steps_') ||
        key.startsWith('water_') ||
        key.startsWith('diet_') ||
        key.startsWith('weight_') ||
        key === 'workouts' ||
        key === 'goals' ||
        key === 'weight_entries'
      );
      
      // Remove fitness data from AsyncStorage
      await AsyncStorage.multiRemove(fitnessKeys);
      
      console.log(`Cleared ${fitnessKeys.length} fitness data items from AsyncStorage`);
    } catch (error) {
      console.error('Error clearing AsyncStorage data:', error);
      throw error;
    }
  }

  static async checkMigrationStatus(userId: string): Promise<{
    needsMigration: boolean;
    localDataExists: boolean;
    firebaseDataExists: boolean;
  }> {
    try {
      // Check if local data exists
      const keys = await AsyncStorage.getAllKeys();
      const localDataExists = keys.some(key => 
        key.startsWith('steps_') ||
        key.startsWith('water_') ||
        key.startsWith('diet_') ||
        key === 'workouts' ||
        key === 'goals' ||
        key === 'weight_entries'
      );

      // Check if Firebase data exists
      const todayKey = new Date().toISOString().split('T')[0];
      const [goals, todaysSteps, workouts] = await Promise.all([
        FirestoreService.getUserGoals(userId),
        FirestoreService.getStepsData(userId, todayKey),
        FirestoreService.getWorkoutEntries(userId, 1),
      ]);

      const firebaseDataExists = !!(goals || todaysSteps || workouts.length > 0);

      return {
        needsMigration: localDataExists && !firebaseDataExists,
        localDataExists,
        firebaseDataExists,
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        needsMigration: false,
        localDataExists: false,
        firebaseDataExists: false,
      };
    }
  }

  static async performMigrationWithProgress(
    userId: string,
    onProgress?: (step: string, progress: number) => void
  ): Promise<{
    success: boolean;
    migratedItems: string[];
    errors: string[];
  }> {
    const steps = [
      'Checking migration status...',
      'Migrating user goals...',
      'Migrating steps data...',
      'Migrating water data...',
      'Migrating diet data...',
      'Migrating weight entries...',
      'Migrating workout entries...',
      'Finalizing migration...'
    ];

    let currentStep = 0;
    const updateProgress = (step: string) => {
      if (onProgress) {
        onProgress(step, (currentStep / steps.length) * 100);
      }
      currentStep++;
    };

    try {
      updateProgress(steps[0]);
      
      const migrationStatus = await this.checkMigrationStatus(userId);
      
      if (!migrationStatus.needsMigration) {
        return {
          success: true,
          migratedItems: ['No migration needed'],
          errors: [],
        };
      }

      updateProgress(steps[1]);
      const result = await this.migrateUserData(userId);

      updateProgress(steps[7]);
      
      if (result.success) {
        // Clear AsyncStorage data after successful migration
        await this.clearAsyncStorageData();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        migratedItems: [],
        errors: [`Migration failed: ${error}`],
      };
    }
  }
}