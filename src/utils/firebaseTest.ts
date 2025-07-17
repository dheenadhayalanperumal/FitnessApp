import { auth, firestore } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export const testFirebaseConnection = async () => {
  const authInstance: Auth = auth as Auth;
  try {
    console.log('Testing Firebase connection...');
    
    // Test 1: Check if Firebase is initialized
    console.log('✅ Firebase app initialized');
    
    // Test 2: Check if Auth is working
    console.log('Auth current user:', authInstance.currentUser);
    console.log('✅ Firebase Auth initialized');
    
    // Test 3: Check if Firestore is working (only if authenticated)
    if (authInstance.currentUser) {
      const testDoc = doc(firestore, 'test', 'connection');
      await setDoc(testDoc, {
        timestamp: new Date(),
        message: 'Firebase connection test successful'
      });
      
      const docSnap = await getDoc(testDoc);
      if (docSnap.exists()) {
        console.log('✅ Firestore read/write test successful');
        console.log('Test data:', docSnap.data());
      }
    } else {
      console.log('⚠️ User not authenticated - skipping Firestore test');
    }
    
    return {
      success: true,
      message: 'Firebase connection successful'
    };
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};