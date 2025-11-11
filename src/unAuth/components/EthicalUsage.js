import React from 'react';
import NavBar from './NavBar';
import Footer from '../../Footer';
import './EthicalUsage.css';

function EthicalUsage() {
  return (
    <div className="ethical-page">
      <NavBar />
      
      <div className="ethical-container">
        <h1 className="ethical-title">Responsible Use of ClarifyFact</h1>
        
        <div className="ethical-content">
          <p className="ethical-intro">
            ClarifyFact is built to help you improve how your content sounds — more natural, clear, 
            and human. We believe AI tools should support your learning and creativity, not replace 
            your effort.
          </p>

          <p className="ethical-text">
            Many students use ClarifyFact to polish drafts, rephrase ideas, or make their writing 
            flow better — and that's exactly how we think our tool should be used. Whether you're 
            working on a paper, project, or personal writing, our platform can help refine and 
            elevate your work.
          </p>

          <div className="ethical-highlight">
            <p>
              However, <strong>we don't encourage using ClarifyFact to bypass AI detection systems 
              or submit humanized content as original academic work.</strong> Every school or 
              university has its own rules, and it's important to respect them. If you're unsure, 
              check with your instructor or advisor.
            </p>
          </div>

          <p className="ethical-text">
            When used responsibly, ClarifyFact can be a powerful tool to help you express yourself 
            better — without crossing ethical lines. We're here to support honest, meaningful work 
            that reflects your own voice and ideas.
          </p>

          <div className="ethical-notice">
            <p>ClarifyFact is not a tool for academic dishonesty or cheating.</p>
          </div>

          <div className="ethical-commitment">
            <h2 className="commitment-heading">Our Commitment</h2>
            <p className="ethical-text">
              We're committed to providing tools that empower users while promoting ethical 
              practices. ClarifyFact is designed to help you communicate more effectively and 
              authentically, supporting your growth as a writer and thinker.
            </p>
            <p className="ethical-text">
              If you have questions about responsible use or need guidance, please don't hesitate 
              to reach out to us at <strong>hello.clarifyfact@gmail.com</strong>.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default EthicalUsage;

