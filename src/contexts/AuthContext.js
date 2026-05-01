import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../firebase';
import { saveUserProfile, getUserProfile } from '../services/databaseService';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

// Adapt Supabase user to match the shape the rest of the app expects
const adaptUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    uid: user.id,
    displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
    photoURL: user.user_metadata?.avatar_url || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      try {
        await saveUserProfile(data.user.id, {
          email,
          display_name: email.split('@')[0],
          provider: 'email',
        });
      } catch (err) {
        console.error('Error creating user profile:', err);
      }
    }
    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session ? adaptUser(session.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session ? adaptUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    refreshUserProfile,
    signup,
    login,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
