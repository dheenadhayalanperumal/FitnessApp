import { ErrorHandlingService } from './errorHandlingService';
// ErrorMonitoringService disabled for clean user experience
// import { ErrorMonitoringService } from './errorMonitoringService';
import { auth } from './firebase';

export class FirestoreErrorHandler {
  
  // Handle Firestore listener errors
  static handleListenerError(error: any, context: string) {
    const errorInfo = ErrorHandlingService.handleFirebaseError(error, context);
    
    // Error monitoring disabled for clean user experience
    
    // Add specific handling for permission denied errors
    if (error.code === 'permission-denied') {
      this.handlePermissionDenied(context);
    }
    
    return errorInfo;
  }
  
  // Handle permission denied errors specifically
  private static handlePermissionDenied(context: string) {
    const user = auth.currentUser;
    
    if (!user) {
      console.warn(`Permission denied in ${context}: User not authenticated`);
      // Error monitoring disabled for clean user experience
    } else {
      console.warn(`Permission denied in ${context}: User ${user.uid} lacks permissions`);
      // Error monitoring disabled for clean user experience
    }
  }
  
  // Create a safe Firestore listener that handles errors
  static createSafeListener<T>(
    listenerFunction: (callback: (data: T) => void) => () => void,
    onData: (data: T) => void,
    onError?: (error: any) => void,
    context: string = 'FirestoreListener'
  ): () => void {
    try {
      return listenerFunction((data: T) => {
        try {
          onData(data);
        } catch (error: any) {
          console.error(`Error in ${context} data callback:`, error);
          this.handleListenerError(error, `${context}.dataCallback`);
        }
      });
    } catch (error: any) {
      console.error(`Error creating ${context} listener:`, error);
      const errorInfo = this.handleListenerError(error, `${context}.createListener`);
      
      if (onError) {
        onError(error);
      }
      
      // Return a no-op unsubscribe function
      return () => {};
    }
  }
  
  // Wrapper for Firestore operations that handles authentication
  static async executeWithAuth<T>(
    operation: () => Promise<T>,
    context: string,
    requireAuth: boolean = true
  ): Promise<T> {
    try {
      // Check authentication if required
      if (requireAuth && !auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Wait a moment for auth to stabilize if just authenticated
      if (requireAuth && auth.currentUser) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return await operation();
    } catch (error: any) {
      console.error(`Error in ${context}:`, error);
      
      // Handle specific error types
      if (error.code === 'permission-denied') {
        this.handlePermissionDenied(context);
        
        // If user is not authenticated, throw a more specific error
        if (!auth.currentUser) {
          throw new Error('You need to be logged in to perform this action.');
        }
      }
      
      const errorInfo = ErrorHandlingService.handleFirebaseError(error, context);
      throw new Error(errorInfo.userMessage);
    }
  }
  
  // Check if Firestore rules are properly configured
  static async checkFirestoreRules(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('Cannot check Firestore rules: User not authenticated');
        return false;
      }
      
      // Try to access user document
      const { doc, getDoc } = await import('firebase/firestore');
      const { firestore } = await import('./firebase');
      
      const userDoc = doc(firestore, 'users', user.uid);
      await getDoc(userDoc);
      
      console.log('Firestore rules check: SUCCESS');
      return true;
    } catch (error: any) {
      console.error('Firestore rules check: FAILED', error);
      
      if (error.code === 'permission-denied') {
        console.error('Firestore security rules are not properly configured or deployed');
        // Error monitoring disabled for clean user experience
      }
      
      return false;
    }
  }
  
  // Create deployment instructions for Firestore rules
  static getDeploymentInstructions(): string {
    return `
To deploy Firestore security rules:

1. Install Firebase CLI:
   npm install -g firebase-tools

2. Login to Firebase:
   firebase login

3. Initialize Firebase in your project (if not already done):
   firebase init firestore

4. Deploy the rules:
   firebase deploy --only firestore:rules

5. Verify deployment in Firebase Console:
   - Go to https://console.firebase.google.com/
   - Select your project: fitnessapp-85a64
   - Navigate to Firestore Database > Rules
   - Check that the rules are active

Current rules file: firestore.rules
`;
  }
}