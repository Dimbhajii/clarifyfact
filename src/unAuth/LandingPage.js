import React, { useState } from 'react';
import NavBar from './components/NavBar';
import QuestionBox from './components/QuestionBox';
import './LandingPage.css';
import Footer from '../Footer';

function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "How does ClarifyFact work?",
      answer: "ClarifyFact uses advanced AI technology to help you create personalized assignments. Simply answer a few questions about your assignment, upload relevant materials, and our system will help generate content tailored to your needs."
    },
    {
      question: "Does ClarifyFact bypass Turnitin and other AI checkers?",
      answer: "ClarifyFact is designed to produce natural, human-like writing. Our rewriting engine is trained on millions of samples of academic writing and uses advanced linguistic modeling to ensure your content appears authentic and original."
    },
    {
      question: "How much does ClarifyFact cost?",
      answer: "We offer flexible pricing plans to suit different needs. You can start with our free trial to explore the platform's features, and then choose from our subscription plans based on your usage requirements."
    },
    {
      question: "What languages does ClarifyFact support?",
      answer: "Currently, ClarifyFact primarily supports English. We're continuously working on expanding language support to serve a wider audience."
    },
    {
      question: "I want to humanize a long essay. Is it possible?",
      answer: "Yes! ClarifyFact can handle essays of various lengths. For longer documents, our system processes them efficiently while maintaining consistency in tone and style throughout."
    },
    {
      question: "Can I upload my class files and notes?",
      answer: "Absolutely! You can upload PDF files of your class materials, lecture notes, and educational slides. Our system will use this information to create more personalized and contextually relevant assignments."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your account settings. Your access will remain active until the end of your current billing period."
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes, we take data security seriously. All uploaded files and generated content are encrypted and stored securely. We never share your personal information or academic work with third parties."
    }
  ];

  return (
    <div className="landing-page">
      <NavBar />
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Your Personalized Humanize AI Assingments & Outsmart AI Detectors</h1>
          <p className="hero-subtitle">
            ClarifyFact helps you write personalized assignments — ensuring you get accurate, 
            reliable answers every time.
          </p>
          <button className="btn-hero-primary">Try for free</button>
          <p className="hero-note">No credit card required</p>
        </div>
      </div>
      <QuestionBox maxWords={500} />
      
      {/* Science & Precision Section */}
      <div className="features-section">
        <div className="feature-left">
          <h2 className="feature-title">Built on Science, Powered by Precision</h2>
          <p className="feature-description">
            Our rewriting engine is trained on over 1.2 million samples of academic writing, 
            scholarly articles, and AI-generated text. Using advanced linguistic modeling, it 
            understands how human writers naturally vary tone, rhythm, and word choice.
          </p>
        </div>
        
        <div className="feature-right">
          <div className="feature-image-container">
            <img 
              src="/ai-detection-demo.png"
              alt="AI text detection demonstration" 
              className="feature-demo-image"
            />
          </div>
        </div>
      </div>

      {/* AI Detectors Section */}
      <div className="detectors-section">
        <div className="detectors-logos">
          <div className="detector-logo-card">ZeroGPT</div>
          <div className="detector-logo-card">Turnitin</div>
          <div className="detector-logo-card">Originality.AI</div>
          <div className="detector-logo-card">QuillBot</div>
          <div className="detector-logo-card">Grammarly</div>
          <div className="detector-logo-card">GPTZero</div>
        </div>
        
        <div className="detectors-content">
          <h2 className="detectors-title">Tested and Proven Across All AI-Detectors</h2>
          <p className="detectors-description">
            We test every rewrite against leading detection tools like GPTZero, Turnitin, 
            ZeroGPT, Quillbot and more.
          </p>
          <p className="detectors-description">
            Our system is updated weekly to adapt to new detection methods and eliminate 
            flagged patterns like burstiness, perplexity, and unnatural phrasing.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="faq-title">FAQ</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span className={`faq-icon ${openFAQ === index ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              {openFAQ === index && (
                <div className="faq-answer">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default LandingPage;

