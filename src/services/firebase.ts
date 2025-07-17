import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYDZUrfHCP704741Bdg7s5fZxDfVaVIpI",
  authDomain: "fitnessapp-85a64.firebaseapp.com",
  projectId: "fitnessapp-85a64",
  storageBucket: "fitnessapp-85a64.firebasestorage.app",
  messagingSenderId: "33708474197",
  appId: "1:33708474197:web:2c1207f7e050ec6a2739dc",
  measurementId: "G-1M7YL5LFW7"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth
let auth: import('firebase/auth').Auth;
try {
  auth = initializeAuth(app);
} catch (error) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Analytics only if supported
let analytics: any = null;
(async () => {
  try {
    if (await isSupported()) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.log('Firebase Analytics not supported in this environment');
  }
})();
// Initialize Firestore
const firestore = getFirestore(app);

// Enable offline persistence for Firestore
// This will be handled in the app initialization

// For development, you can connect to Firestore emulator
// Uncomment the following lines for local development:
// if (__DEV__) {
//   connectFirestoreEmulator(firestore, 'localhost', 8080);
// }

export { auth, firestore, analytics };
export default app;