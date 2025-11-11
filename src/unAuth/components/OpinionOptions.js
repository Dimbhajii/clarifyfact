import React from 'react';
import './OpinionOptions.css';

function OpinionOptions({ summary, opinionOptions, onSelectOpinion, isLoading }) {
  return (
    <div className="opinion-options-container">
      <div className="summary-section">
        <h2 className="summary-title">Assignment Summary</h2>
        <div className="summary-content">
          <p>{summary}</p>
        </div>
      </div>

      <div className="options-section">
        <h2 className="options-title">Choose Your Viewpoint</h2>
        <p className="options-description">
          Select the opinion or approach you'd like to take for this assignment:
        </p>
        
        <div className="opinion-options-grid">
          {opinionOptions.map((option) => (
            <div
              key={option.id}
              className="opinion-option-card"
              onClick={() => !isLoading && onSelectOpinion(option)}
            >
              <div className="option-header">
                <h3 className="option-title">{option.title}</h3>
                <div className="option-number">Option {option.id}</div>
              </div>
              <p className="option-description">{option.description}</p>
              <button 
                className="option-select-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Select This Option'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OpinionOptions;

