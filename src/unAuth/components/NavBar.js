import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import './NavBar.css';

function NavBar() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { currentUser, userProfile, logout } = useAuth();

  const handleContactClick = (e) => {
    e.preventDefault();
    alert('hello.clarifyfact@gmail.com');
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1>ClarifyFact</h1>
            </Link>
          </div>
          <div className="navbar-menu">
            <a href="#contact" className="navbar-link" onClick={handleContactClick}>Contact</a>
            <Link to="/pricing" className="navbar-link">Pricing</Link>
            {currentUser && (
              <Link to="/my-assignments" className="navbar-link">My Assignments</Link>
            )}
          </div>
          <div className="navbar-actions">
            {currentUser ? (
              <>
                <div className="user-info">
                  <span className="word-balance">
                    {userProfile?.wordBalance !== undefined ? userProfile.wordBalance.toLocaleString() : '1,500'} words
                  </span>
                  <span className="user-email">{currentUser.email}</span>
                </div>
                <button className="btn-login" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <button className="btn-login" onClick={handleLoginClick}>Log in</button>
                <button className="btn-primary" onClick={handleSignupClick}>Try for free</button>
              </>
            )}
          </div>
        </div>
      </nav>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}

export default NavBar;
