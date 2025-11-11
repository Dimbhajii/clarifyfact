import React from 'react';
import { Link } from 'react-router-dom';
import './PremiumPlus.css';

function PremiumPlus() {
  return (
    <div className="premium-plus-section">
      <div className="premium-plus-container">
        <div className="premium-plus-content">
          <div className="premium-plus-badge">
            <span className="premium-icon">⭐</span>
            <span>Premium Plus</span>
          </div>
          
          <h2 className="premium-plus-title">Unlock Premium Plus Features</h2>
          
          <p className="premium-plus-description">
            Get unlimited access to advanced AI humanization, priority support, and exclusive features.
          </p>

          <div className="premium-features-grid">
            <div className="premium-feature">
              <span className="feature-icon">🚀</span>
              <div className="feature-content">
                <h3 className="feature-title">Unlimited Words</h3>
                <p className="feature-desc">No monthly word limits. Write as much as you need.</p>
              </div>
            </div>
            
            <div className="premium-feature">
              <span className="feature-icon">⚡</span>
              <div className="feature-content">
                <h3 className="feature-title">Priority Processing</h3>
                <p className="feature-desc">Get your content processed 10x faster with priority queue.</p>
              </div>
            </div>
            
            <div className="premium-feature">
              <span className="feature-icon">🛡️</span>
              <div className="feature-content">
                <h3 className="feature-title">AI Detector Bypass</h3>
                <p className="feature-desc">100% bypass rate across all major AI detection tools.</p>
              </div>
            </div>
            
            <div className="premium-feature">
              <span className="feature-icon">📚</span>
              <div className="feature-content">
                <h3 className="feature-title">Unlimited File Uploads</h3>
                <p className="feature-desc">Upload unlimited PDFs, documents, and educational materials.</p>
              </div>
            </div>
            
            <div className="premium-feature">
              <span className="feature-icon">🎯</span>
              <div className="feature-content">
                <h3 className="feature-title">Advanced Personalization</h3>
                <p className="feature-desc">AI-powered content tailored to your specific academic style.</p>
              </div>
            </div>
            
            <div className="premium-feature">
              <span className="feature-icon">💬</span>
              <div className="feature-content">
                <h3 className="feature-title">24/7 Priority Support</h3>
                <p className="feature-desc">Get instant help from our dedicated support team.</p>
              </div>
            </div>
          </div>

          <div className="premium-pricing">
            <div className="pricing-display">
              <span className="price-amount">$19.99</span>
              <span className="price-period">/month</span>
            </div>
            <p className="pricing-note">or <strong>$199/year</strong> (Save 17%)</p>
          </div>

          <div className="premium-cta">
            <Link to="/pricing" className="btn-premium-upgrade">
              Upgrade to Premium Plus
            </Link>
            <p className="cta-note">Start your 7-day free trial • No credit card required</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumPlus;

