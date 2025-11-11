import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PremiumFeature.css';

function PremiumFeature({ userSubscription }) {
  const [isOpen, setIsOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [premiumText, setPremiumText] = useState('');
  
  // Determine word limit based on subscription tier
  const getWordLimit = () => {
    if (!userSubscription || userSubscription === 'free') {
      return 0; // No access for free users
    } else if (userSubscription === 'starter') {
      return 5000;
    } else if (userSubscription === 'pro') {
      return 10000;
    }
    return 0;
  };

  const wordLimit = getWordLimit();
  const hasAccess = wordLimit > 0;
  const remainingWords = Math.max(0, wordLimit - wordCount);

  // Load saved data from localStorage (for demo purposes)
  useEffect(() => {
    const savedCount = localStorage.getItem('premiumWordCount');
    const savedText = localStorage.getItem('premiumText');
    if (savedCount) {
      setWordCount(parseInt(savedCount, 10));
    }
    if (savedText) {
      setPremiumText(savedText);
    }
  }, []);

  // Get word count from text
  const getWords = (text) => {
    return text.trim().length === 0 ? [] : text.trim().split(/\s+/).filter(Boolean);
  };

  // Limit text to max words
  const limitToMaxWords = (text, maxWords) => {
    const words = getWords(text);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ');
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    const words = getWords(text);
    const newWordCount = words.length;
    
    if (newWordCount <= wordLimit) {
      setPremiumText(text);
      setWordCount(newWordCount);
      localStorage.setItem('premiumText', text);
      localStorage.setItem('premiumWordCount', newWordCount.toString());
    } else {
      // Limit to max words
      const limitedText = limitToMaxWords(text, wordLimit);
      setPremiumText(limitedText);
      setWordCount(wordLimit);
      localStorage.setItem('premiumText', limitedText);
      localStorage.setItem('premiumWordCount', wordLimit.toString());
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleUpgrade = () => {
    setIsOpen(false);
    // Navigate to pricing page or handle upgrade
  };

  if (!hasAccess && isOpen) {
    return (
      <div className="premium-feature-overlay" onClick={handleClose}>
        <div className="premium-feature-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
          
          <div className="premium-lock-content">
            <div className="lock-icon">🔒</div>
            <h2>Premium Feature</h2>
            <p className="lock-description">
              This feature is only available for paid subscribers.
            </p>
            
            <div className="subscription-tiers">
              <div className="tier-card">
                <h3>Starter</h3>
                <div className="tier-price">$2.45<span>/month</span></div>
                <ul className="tier-features">
                  <li>✓ 5,000 words/month</li>
                  <li>✓ Personalized Results</li>
                  <li>✓ Basic AI humanization</li>
                  <li>✓ Standard support</li>
                </ul>
                <Link to="/pricing" className="tier-button" onClick={handleClose}>
                  Get Started
                </Link>
              </div>
              
              <div className="tier-card popular-tier">
                <div className="popular-badge">Popular</div>
                <h3>Pro</h3>
                <div className="tier-price">$9.99<span>/month</span></div>
                <ul className="tier-features">
                  <li>✓ 10,000 words/month</li>
                  <li>✓ Advanced AI humanization</li>
                  <li>✓ All AI detectors bypass</li>
                  <li>✓ Priority support</li>
                  <li>✓ Unlimited file uploads</li>
                </ul>
                <Link to="/pricing" className="tier-button popular-btn" onClick={handleClose}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button 
        className={`navbar-premium-btn ${hasAccess ? 'has-access' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <span className="premium-icon">⭐</span>
        {hasAccess ? `Premium (${remainingWords.toLocaleString()} words left)` : 'Premium'}
      </button>

      {isOpen && hasAccess && (
        <div className="premium-feature-overlay" onClick={handleClose}>
          <div className="premium-feature-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleClose}>×</button>
            
            <div className="premium-feature-content">
              <div className="feature-header">
                <h2>Premium Feature</h2>
                <div className="subscription-badge">
                  {userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)} Plan
                </div>
              </div>
              
              <div className="word-limit-info">
                <div className="limit-display">
                  <span className="limit-label">Word Limit:</span>
                  <span className="limit-value">{wordLimit.toLocaleString()} words/month</span>
                </div>
                <div className="usage-display">
                  <div className="usage-bar-container">
                    <div 
                      className="usage-bar" 
                      style={{ width: `${(wordCount / wordLimit) * 100}%` }}
                    ></div>
                  </div>
                  <div className="usage-text">
                    {wordCount.toLocaleString()} / {wordLimit.toLocaleString()} words used
                  </div>
                </div>
              </div>

              <div className="feature-input-section">
                <label htmlFor="premium-text-input" className="input-label">
                  Enter your text:
                </label>
                <textarea
                  id="premium-text-input"
                  className="premium-text-input"
                  placeholder="Start typing your content here..."
                  value={premiumText}
                  onChange={handleTextChange}
                  rows="10"
                />
                <div className="word-count-display">
                  <span>{wordCount.toLocaleString()} / {wordLimit.toLocaleString()} words</span>
                </div>
              </div>

              {userSubscription === 'starter' && (
                <div className="upgrade-promo">
                  <p>Need more words? Upgrade to <strong>Pro</strong> for 10,000 words/month</p>
                  <Link to="/pricing" className="upgrade-link" onClick={handleClose}>
                    Upgrade Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PremiumFeature;

