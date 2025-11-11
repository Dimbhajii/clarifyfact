import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { saveUserProfile, getUserProfile } from '../services/databaseService';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email/password
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user profile in Firestore
      if (userCredential.user) {
        try {
          await saveUserProfile(userCredential.user.uid, {
            email: email,
            displayName: email.split('@')[0],
            provider: 'email'
          });
        } catch (error) {
          console.error('Error creating user profile:', error);
          // Don't fail signup if profile creation fails
        }
      }
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      // Re-throw the error so AuthModal can handle it
      throw error;
    }
  };

  // Sign in with email/password
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw the error so AuthModal can handle it
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Create/update user profile in Firestore
      if (result.user) {
        try {
          await saveUserProfile(result.user.uid, {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'google'
          });
        } catch (error) {
          console.error('Error saving user profile:', error);
          // Don't fail signin if profile save fails - user is still authenticated
          // The profile will be created/updated on next load
        }
      }
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      // Re-throw the error so AuthModal can handle it with user-friendly messages
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    return await signOut(auth);
  };

  // Load user profile when user changes
  useEffect(() => {
    const loadUserProfile = async (userId) => {
      try {
        const profile = await getUserProfile(userId);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setUserProfile(null);
      }
    };

    if (currentUser) {
      loadUserProfile(currentUser.uid);
    } else {
      setUserProfile(null);
    }
  }, [currentUser]);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh user profile (call this after balance updates)
  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  const value = {
    currentUser,
    userProfile,
    refreshUserProfile,
    signup,
    login,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

