import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
  Auth,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User } from '../types';
import { ErrorHandlingService } from './errorHandlingService';

export class AuthService {
  private static auth: Auth = auth as Auth;
  // Register new user
  static async register(name: string, email: string, password: string): Promise<User> {
    try {
      // Create user with email and password
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update the user's display name
      await updateProfile(firebaseUser, {
        displayName: name,
      });
      
      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);
      
      return userData;
    } catch (error: any) {
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'AuthService.register');
      throw new Error(errorInfo.userMessage);
    }
  }
  
  // Login user
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      const userData = userDoc.data() as User;
      
      // Update last login time
      await updateDoc(doc(firestore, 'users', firebaseUser.uid), {
        updatedAt: new Date(),
      });
      
      return userData;
    } catch (error: any) {
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'AuthService.login');
      throw new Error(errorInfo.userMessage);
    }
  }
  
  // Logout user
  static async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'AuthService.logout');
      throw new Error(errorInfo.userMessage);
    }
  }
  
  // Get current user data
  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = this.auth.currentUser;
      
      if (!firebaseUser) {
        return null;
      }
      
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return userDoc.data() as User;
    } catch (error: any) {
      ErrorHandlingService.handleFirebaseError(error, 'AuthService.getCurrentUser');
      return null;
    }
  }
  
  // Send password reset email
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'AuthService.resetPassword');
      throw new Error(errorInfo.userMessage);
    }
  }
  
  // Update user profile
  static async updateUserProfile(updates: Partial<User>): Promise<void> {
    try {
      const firebaseUser = this.auth.currentUser;
      
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }
      
      // Update Firebase Auth profile if name changed
      if (updates.name && updates.name !== firebaseUser.displayName) {
        await updateProfile(firebaseUser, {
          displayName: updates.name,
        });
      }
      
      // Update user document in Firestore
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await updateDoc(doc(firestore, 'users', firebaseUser.uid), updateData);
    } catch (error: any) {
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, 'AuthService.updateUserProfile');
      throw new Error(errorInfo.userMessage);
    }
  }
  
  // Listen to authentication state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            callback(userDoc.data() as User);
          } else {
            callback(null);
          }
        } catch (error) {
          ErrorHandlingService.handleFirebaseError(error as any, 'AuthService.onAuthStateChanged');
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}