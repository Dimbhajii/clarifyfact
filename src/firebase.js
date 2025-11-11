// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBO1mVOpVJ_YyA4fcNYPsK9Cv2E5wugAe8",
  authDomain: "clarifyfact-afa06.firebaseapp.com",
  projectId: "clarifyfact-afa06",
  storageBucket: "clarifyfact-afa06.firebasestorage.app",
  messagingSenderId: "72447431817",
  appId: "1:72447431817:web:e18e53e439781705c2e258",
  measurementId: "G-DFW361F7Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

const functions = getFunctions(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export the cloud function caller
export const nextQuestion = httpsCallable(functions, 'nextQuestion');
export { auth, googleProvider, db };