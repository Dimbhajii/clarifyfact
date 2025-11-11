import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { addWordBalance } from '../../services/databaseService';
import NavBar from './NavBar';
import Footer from '../../Footer';
import './Pricing.css';

function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { currentUser, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Word amounts for each plan
  const wordAmounts = {
    'Starter': 10000, // 10,000 words per month
    'Pro': 50000, // 50,000 words per month
  };

  const plans = {
    monthly: [
      {
        name: 'Starter',
        price: '$3.98',
        period: '/month',
        features: [
          'Personalized Results',
          'Up to 10,000 words/month',
          'Basic AI humanization',
          'Standard support',
          'Email support'
        ],
        buttonText: 'Subscribe',
        popular: false
      },
      {
        name: 'Pro',
        price: '$9.99',
        period: '/month',
        features: [
          'Personalized Results',
          'Up to 50,000 words/month',
          'Advanced AI humanization',
          'Priority support',
          'All AI detectors bypass',
          'Unlimited file uploads',
          'API access'
        ],
        buttonText: 'Subscribe',
        popular: true
      },
      {
        name: 'Enterprise',
        price: 'Contact',
        period: '',
        features: [
          'Personalized Results',
          'Unlimited words',
          'Premium AI humanization',
          'Dedicated support',
          'Custom AI training',
          'Team collaboration',
          'Advanced analytics',
          'API access'
        ],
        buttonText: 'Contact Us',
        popular: false,
        isContact: true
      }
    ],
    annual: [
      {
        name: 'Starter',
        price: '$32.99',
        period: '/year',
        originalPrice: '$47.76',
        features: [
          'Personalized Results',
          'Up to 10,000 words/month',
          'Basic AI humanization',
          'Standard support',
          'Email support'
        ],
        buttonText: 'Subscribe',
        popular: false
      },
      {
        name: 'Pro',
        price: '$59.94',
        period: '/year',
        originalPrice: '$119.88',
        features: [
          'Personalized Results',
          'Up to 50,000 words/month',
          'Advanced AI humanization',
          'Priority support',
          'All AI detectors bypass',
          'Unlimited file uploads',
          'API access'
        ],
        buttonText: 'Subscribe',
        popular: true
      },
      {
        name: 'Enterprise',
        price: 'Contact',
        period: '',
        features: [
          'Personalized Results',
          'Unlimited words',
          'Premium AI humanization',
          'Dedicated support',
          'Custom AI training',
          'Team collaboration',
          'Advanced analytics',
          'API access'
        ],
        buttonText: 'Contact Us',
        popular: false,
        isContact: true
      }
    ]
  };

  const currentPlans = plans[billingCycle];

  // Handle plan purchase
  const handlePurchase = async (planName) => {
    if (!currentUser) {
      alert('Please sign in to purchase a plan.');
      navigate('/');
      return;
    }

    if (!wordAmounts[planName]) {
      // Enterprise plan - contact
      alert('hello.clarifyfact@gmail.com');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const wordAmount = wordAmounts[planName];
      
      // In a real app, you would process payment here
      // For now, we'll just add the words to the user's balance
      // TODO: Integrate payment processing (Stripe, PayPal, etc.)
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add words to user balance
      await addWordBalance(currentUser.uid, wordAmount);
      
      // Refresh user profile to update balance display
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      
      setSuccess(`Successfully added ${wordAmount.toLocaleString()} words to your account!`);
      
      // Show success message for 3 seconds, then redirect
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Error purchasing plan:', error);
      setError(`Failed to purchase plan: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pricing-page">
      <NavBar />
      
      <div className="pricing-container">
        <h1 className="pricing-title">Flexible pricing plans for you</h1>
        
        {error && (
          <div style={{ 
            margin: '20px auto', 
            maxWidth: '600px', 
            padding: '15px', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            color: '#721c24'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            margin: '20px auto', 
            maxWidth: '600px', 
            padding: '15px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb',
            borderRadius: '5px',
            color: '#155724'
          }}>
            <strong>Success:</strong> {success}
          </div>
        )}
        
        <div className="billing-toggle">
          <button 
            className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="save-badge">Save 50%</span>
          </button>
        </div>

        <div className="pricing-cards">
          {currentPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <h3 className="plan-name">{plan.name}</h3>
              
              <div className="plan-price">
                {plan.originalPrice && (
                  <span className="original-price">{plan.originalPrice}</span>
                )}
                <span className="price">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              
              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                className={`plan-button ${plan.popular ? 'popular-btn' : ''}`}
                onClick={() => handlePurchase(plan.name)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="need-more">
          <p>Need more? <a href="#contact" onClick={(e) => { e.preventDefault(); alert('hello.clarifyfact@gmail.com'); }}>Contact Us</a></p>
        </div>

        <div className="pricing-disclaimer">
          <p>By clicking the Subscribe button, you agree to our <Link to="/terms-of-service">Terms of Service</Link> and <a href="#privacy">Privacy Policy</a>.</p>
          <p className="academic-notice">ClarifyFact is not a tool for academic dishonesty or cheating. <Link to="/ethical-usage" className="read-more-link">Read more</Link></p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Pricing;

