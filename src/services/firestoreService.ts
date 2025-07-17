import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from './firebase';
import {
  StepsData,
  WaterIntake,
  DietEntry,
  WeightEntry,
  WorkoutEntry,
  Goals,
  User,
} from '../types';
import { ErrorHandlingService } from './errorHandlingService';

export class FirestoreService {
  private static getCollectionPath(userId: string, collection: string): string {
    return `users/${userId}/${collection}`;
  }

  // Generic CRUD operations
  static async setDocument<T>(path: string, data: T): Promise<void> {
    try {
      await setDoc(doc(firestore, path), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error setting document:', error);
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'FirestoreService.setDocument');
      throw new Error(errorInfo.userMessage);
    }
  }

  static async getDocument<T>(path: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(firestore, path));
      return docSnap.exists() ? (docSnap.data() as T) : null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  static async addDocument<T>(collectionPath: string, data: T): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, collectionPath), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  static async updateDocument(path: string, data: Partial<any>): Promise<void> {
    try {
      await updateDoc(doc(firestore, path), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(path: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, path));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Steps Data Operations
  static async saveStepsData(userId: string, stepsData: StepsData): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'steps')}/${stepsData.date}`;
    await this.setDocument(path, stepsData);
  }

  static async getStepsData(userId: string, date: string): Promise<StepsData | null> {
    const path = `${this.getCollectionPath(userId, 'steps')}/${date}`;
    return await this.getDocument<StepsData>(path);
  }

  static async getStepsDataRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<StepsData[]> {
    try {
      const q = query(
        collection(firestore, this.getCollectionPath(userId, 'steps')),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as StepsData);
    } catch (error) {
      console.error('Error getting steps data range:', error);
      throw error;
    }
  }

  // Water Intake Operations
  static async saveWaterIntake(userId: string, waterData: WaterIntake): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'water')}/${waterData.date}`;
    await this.setDocument(path, waterData);
  }

  static async getWaterIntake(userId: string, date: string): Promise<WaterIntake | null> {
    const path = `${this.getCollectionPath(userId, 'water')}/${date}`;
    return await this.getDocument<WaterIntake>(path);
  }

  static async getWaterIntakeRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WaterIntake[]> {
    try {
      const q = query(
        collection(firestore, this.getCollectionPath(userId, 'water')),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as WaterIntake);
    } catch (error) {
      console.error('Error getting water intake range:', error);
      throw error;
    }
  }

  // Diet Entry Operations
  static async saveDietEntry(userId: string, dietData: DietEntry): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'diet')}/${dietData.date}`;
    await this.setDocument(path, dietData);
  }

  static async getDietEntry(userId: string, date: string): Promise<DietEntry | null> {
    const path = `${this.getCollectionPath(userId, 'diet')}/${date}`;
    return await this.getDocument<DietEntry>(path);
  }

  // Weight Entry Operations
  static async addWeightEntry(userId: string, weightEntry: WeightEntry): Promise<string> {
    return await this.addDocument(
      this.getCollectionPath(userId, 'weight'),
      weightEntry
    );
  }

  static async getWeightEntries(userId: string, limitCount: number = 50): Promise<WeightEntry[]> {
    try {
      const q = query(
        collection(firestore, this.getCollectionPath(userId, 'weight')),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as WeightEntry));
    } catch (error) {
      console.error('Error getting weight entries:', error);
      throw error;
    }
  }

  static async updateWeightEntry(
    userId: string,
    entryId: string,
    updates: Partial<WeightEntry>
  ): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'weight')}/${entryId}`;
    await this.updateDocument(path, updates);
  }

  static async deleteWeightEntry(userId: string, entryId: string): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'weight')}/${entryId}`;
    await this.deleteDocument(path);
  }

  // Workout Entry Operations
  static async addWorkoutEntry(userId: string, workoutEntry: WorkoutEntry): Promise<string> {
    return await this.addDocument(
      this.getCollectionPath(userId, 'workouts'),
      workoutEntry
    );
  }

  static async getWorkoutEntries(userId: string, limitCount: number = 50): Promise<WorkoutEntry[]> {
    try {
      const q = query(
        collection(firestore, this.getCollectionPath(userId, 'workouts')),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as WorkoutEntry));
    } catch (error) {
      console.error('Error getting workout entries:', error);
      throw error;
    }
  }

  static async getWorkoutsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkoutEntry[]> {
    try {
      const q = query(
        collection(firestore, this.getCollectionPath(userId, 'workouts')),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as WorkoutEntry));
    } catch (error) {
      console.error('Error getting workouts by date range:', error);
      throw error;
    }
  }

  static async updateWorkoutEntry(
    userId: string,
    entryId: string,
    updates: Partial<WorkoutEntry>
  ): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'workouts')}/${entryId}`;
    await this.updateDocument(path, updates);
  }

  static async deleteWorkoutEntry(userId: string, entryId: string): Promise<void> {
    const path = `${this.getCollectionPath(userId, 'workouts')}/${entryId}`;
    await this.deleteDocument(path);
  }

  // Goals Operations
  static async saveUserGoals(userId: string, goals: Goals): Promise<void> {
    const path = `users/${userId}/settings/goals`;
    await this.setDocument(path, goals);
  }

  static async getUserGoals(userId: string): Promise<Goals | null> {
    const path = `users/${userId}/settings/goals`;
    return await this.getDocument<Goals>(path);
  }

  // Real-time listeners
  static subscribeToStepsData(
    userId: string,
    date: string,
    callback: (data: StepsData | null) => void
  ): () => void {
    const path = `${this.getCollectionPath(userId, 'steps')}/${date}`;
    return onSnapshot(
      doc(firestore, path), 
      (doc) => {
        callback(doc.exists() ? (doc.data() as StepsData) : null);
      },
      (error) => {
        console.error('Error in steps data listener:', error);
        ErrorHandlingService.handleFirebaseError(error, 'FirestoreService.subscribeToStepsData');
      }
    );
  }

  static subscribeToWaterIntake(
    userId: string,
    date: string,
    callback: (data: WaterIntake | null) => void
  ): () => void {
    const path = `${this.getCollectionPath(userId, 'water')}/${date}`;
    return onSnapshot(
      doc(firestore, path), 
      (doc) => {
        callback(doc.exists() ? (doc.data() as WaterIntake) : null);
      },
      (error) => {
        console.error('Error in water intake listener:', error);
        ErrorHandlingService.handleFirebaseError(error, 'FirestoreService.subscribeToWaterIntake');
      }
    );
  }

  static subscribeToWorkouts(
    userId: string,
    callback: (workouts: WorkoutEntry[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.getCollectionPath(userId, 'workouts')),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(
      q, 
      (querySnapshot) => {
        const workouts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as WorkoutEntry));
        callback(workouts);
      },
      (error) => {
        console.error('Error in workouts listener:', error);
        ErrorHandlingService.handleFirebaseError(error, 'FirestoreService.subscribeToWorkouts');
      }
    );
  }

  // Batch operations for efficient data migration
  static async batchWrite(operations: (() => Promise<void>)[]): Promise<void> {
    const batch = writeBatch(firestore);
    
    try {
      for (const operation of operations) {
        await operation();
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Batch write error:', error);
      throw error;
    }
  }

  // Network management for offline support
  static async enableOfflineSupport(): Promise<void> {
    try {
      await enableNetwork(firestore);
    } catch (error) {
      console.error('Error enabling network:', error);
    }
  }

  static async disableOfflineSupport(): Promise<void> {
    try {
      await disableNetwork(firestore);
    } catch (error) {
      console.error('Error disabling network:', error);
    }
  }
}