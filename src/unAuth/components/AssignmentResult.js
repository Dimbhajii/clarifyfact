import React, { useState } from 'react';
import './AssignmentResult.css';

function AssignmentResult({ assignment, isLoading, error, saveStatus, assignmentId, isAuthenticated }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Strip HTML tags when copying to clipboard for plain text
    const textOnly = assignment.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    navigator.clipboard.writeText(textOnly);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Strip HTML tags when downloading for plain text
    const textOnly = assignment.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const blob = new Blob([textOnly], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assignment.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="assignment-result-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Generating Your Assignment</h2>
          <p>This may take a few moments. We're creating a personalized, plagiarism-free assignment for you.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignment-result-container">
        <div className="error-section">
          <h2>Error Generating Assignment</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-result-container">
      <div className="result-header">
        <h2>Your Personalized Assignment</h2>
        <p className="result-subtitle">
          This assignment has been generated based on your selected opinion and fact-checked sources. 
          It's been humanized to bypass AI detection tools.
        </p>
        {isAuthenticated && saveStatus === 'saved' && (
          <div className="save-status success">
            ✓ Assignment saved to your account
          </div>
        )}
        {isAuthenticated && saveStatus === 'saving' && (
          <div className="save-status saving">
            ⏳ Saving assignment...
          </div>
        )}
        {isAuthenticated && saveStatus === 'error' && (
          <div className="save-status error">
            ⚠️ Failed to save assignment. You can still copy it.
          </div>
        )}
        {!isAuthenticated && (
          <div className="save-status info">
            💡 <a href="#login" onClick={(e) => { e.preventDefault(); alert('Please sign in to save your assignments.'); }}>Sign in</a> to save this assignment to your account
          </div>
        )}
      </div>

      <div className="result-actions">
        <button 
          className="action-btn copy-btn"
          onClick={handleCopy}
        >
          {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </button>
        <button 
          className="action-btn download-btn"
          onClick={handleDownload}
        >
          📥 Download as TXT
        </button>
      </div>

      <div className="assignment-content">
        <div 
          className="assignment-text"
          dangerouslySetInnerHTML={{ 
            __html: assignment
              .split(/\n\n+/) // Split by double newlines (paragraphs)
              .map(para => {
                // If paragraph contains HTML, preserve it
                if (/<span style=/.test(para)) {
                  return `<p>${para.replace(/\n/g, '<br />')}</p>`;
                }
                // Plain text paragraph
                return `<p>${para.replace(/\n/g, '<br />')}</p>`;
              })
              .join('')
          }}
        />
      </div>

      <div className="result-footer">
        <div className="info-badge">
          <span className="badge-icon">✓</span>
          <span>Plagiarism-free and humanized</span>
        </div>
        <div className="info-badge">
          <span className="badge-icon">✓</span>
          <span>Fact-checked sources included</span>
        </div>
        <div className="info-badge">
          <span className="badge-icon">✓</span>
          <span>Optimized to bypass AI detectors</span>
        </div>
      </div>
    </div>
  );
}

export default AssignmentResult;

