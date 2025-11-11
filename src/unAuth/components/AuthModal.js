import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthModal.css';

function AuthModal({ isOpen, onClose, initialMode = 'login', message }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, signInWithGoogle } = useAuth();

  // Clear error when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Clear error when switching between login/signup
  useEffect(() => {
    setError('');
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else {
        await signup(email, password);
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      // Provide more helpful error messages
      if (err.code === 'auth/internal-error') {
        errorMessage = 'Authentication service error. Please check that Email/Password authentication is enabled in Firebase Console, or try again later.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please log in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password authentication is not enabled. Please enable it in Firebase Console.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      console.error('Google auth error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Full error object:', err);
      
      let errorMessage = 'Sign-in failed. Please try again.';
      
      // Provide more helpful error messages for Google sign-in
      if (err.code === 'auth/internal-error') {
        errorMessage = 'Google Sign-in is not enabled. Please enable it in Firebase Console: Authentication → Sign-in method → Google → Enable. See QUICK_FIX_GOOGLE_SIGNIN.md for detailed instructions.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email. Please sign in with your original sign-in method (email/password).';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-in is not enabled. Please enable it in Firebase Console: Authentication → Sign-in method → Google → Enable.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google Sign-in. Please check Firebase Console → Authentication → Settings → Authorized domains.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (err.message && (err.message.includes('OAuth') || err.message.includes('oauth'))) {
        errorMessage = 'OAuth configuration error. Please check that OAuth consent screen is configured in Google Cloud Console. See QUICK_FIX_GOOGLE_SIGNIN.md for instructions.';
      } else if (err.message) {
        // Use the error message if available, but make it more user-friendly
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        {message && (
          <div className="auth-message-banner">
            <strong>{message}</strong>
          </div>
        )}
        
        <h2>{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="auth-form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••"
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Loading...' : (mode === 'login' ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="auth-google-btn"
        >
          <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711s.102-1.171.282-1.711V4.957H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.043l2.987-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.957L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </g>
          </svg>
          {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;

