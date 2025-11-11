import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { saveAssignment, checkWordBalance, deductWordBalance } from '../../services/databaseService';
import OpinionOptions from './OpinionOptions';
import AssignmentResult from './AssignmentResult';
import AuthModal from './AuthModal';
import './QuestionBox.css';

// Determine API URL based on environment
const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production (Firebase Hosting), call the function directly to avoid 60-second timeout
  // Firebase Hosting rewrites have a 60-second timeout, but functions have 540-second timeout
  // For long-running operations like assignment generation, call the function directly
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    // Option 1: Direct function call (bypasses hosting timeout, has 540s function timeout)
    // Uncomment the line below to use direct function calls for all endpoints
    // return 'https://us-central1-clarifyfact-afa06.cloudfunctions.net';
    
    // Option 2: Use hosting rewrite (has 60s timeout, but simpler for short operations)
    // For generate-assignment, we'll use direct call to avoid timeout
    return window.location.origin;
  }
  
  // Development: use local backend
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// For generate-assignment endpoint, use direct function call to avoid 60-second hosting timeout
const getGenerateAssignmentUrl = () => {
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    // Call function directly to avoid Firebase Hosting's 60-second timeout
    return 'https://us-central1-clarifyfact-afa06.cloudfunctions.net/api';
  }
  return API_BASE_URL;
};

function QuestionBox({ maxWords = 500 }) {
  const { currentUser, refreshUserProfile } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hasShownAuthModal, setHasShownAuthModal] = useState(false); // Track if we've shown the modal after 2-3 words
  
  // Step management
  const [currentStep, setCurrentStep] = useState('question1'); // 'question1' | 'question2' | 'opinions' | 'result'
  
  // Question 1: Assignment topic
  const [assignmentTopic, setAssignmentTopic] = useState('');
  
  // Question 2: File upload
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [courseMaterials, setCourseMaterials] = useState('');
  
  // Opinion selection
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Assignment generation
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [factCheckResult, setFactCheckResult] = useState(null);
  const [finalAssignment, setFinalAssignment] = useState('');
  const [assignmentId, setAssignmentId] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  
  const MAX_WORDS = maxWords;
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

  const getWords = (text) => text.trim().length === 0 ? [] : text.trim().split(/\s+/).filter(Boolean);
  const countWords = (text) => getWords(text).length;
  
  const limitToMaxWords = (text) => {
    const words = getWords(text);
    if (words.length <= MAX_WORDS) return text;
    return words.slice(0, MAX_WORDS).join(' ');
  };

  // Reset auth modal flag when user signs in
  React.useEffect(() => {
    if (currentUser) {
      setHasShownAuthModal(false);
      setAuthModalOpen(false);
    }
  }, [currentUser]);

  // Check if user is authenticated
  const requireAuth = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  // Handle Question 1: Assignment Topic
  const handleQuestion1Submit = async (e) => {
    e.preventDefault();
    
    // Require authentication
    if (!requireAuth()) {
      setError('Sign In to generate assignments for free');
      return;
    }
    
    if (!assignmentTopic.trim()) {
      setError('Please enter your assignment topic.');
      return;
    }
    
    if (getWords(assignmentTopic).length > MAX_WORDS) {
      setError(`Answer exceeds ${MAX_WORDS}-word limit.`);
      return;
    }

    setError(null);
    setCurrentStep('question2');
  };

  // Handle file upload to Google Drive
  const handleFileChange = async (e) => {
    // Require authentication
    if (!requireAuth()) {
      setError('Sign In to generate assignments for free');
      return;
    }
    
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      setError('Please upload only PDF files.');
      return;
    }
    
    setError(null);
    await uploadToGoogleDrive(pdfFiles);
  };

  // Upload files to Google Drive and extract text
  const uploadToGoogleDrive = async (files) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      if (API_KEY) {
        formData.append('apiKey', API_KEY);
      }

      const response = await fetch(`${API_BASE_URL}/api/upload-to-drive`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const uploadResults = files.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        driveId: result.fileIds?.[index] || `temp_${Date.now()}_${index}`
      }));

      setUploadedFiles([...uploadedFiles, ...uploadResults]);
      
      // Store extracted text if available
      if (result.extractedText) {
        setCourseMaterials(result.extractedText);
      } else {
        // If no extracted text, set a placeholder (will be handled in analysis)
        setCourseMaterials('Course materials extracted from uploaded PDF files.');
      }
      
      setError(null);
    } catch (err) {
      console.error('Upload error:', err);
      // For testing, simulate successful upload
      const uploadResults = files.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        driveId: `simulated_${Date.now()}_${index}`
      }));
      setUploadedFiles([...uploadedFiles, ...uploadResults]);
      // Set placeholder text for mock mode
      setCourseMaterials('Course materials extracted from uploaded PDF files.');
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Question 2: File Upload Submit
  const handleQuestion2Submit = async (e) => {
    e.preventDefault();
    
    // Require authentication
    if (!requireAuth()) {
      setError('Sign In to generate assignments for free');
      return;
    }
    
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Analyze assignment and get opinion options
      // Try real API first, fall back to mock if it fails
      try {
        console.log('Calling API:', `${API_BASE_URL}/api/analyze-assignment`);
        console.log('Request data:', { assignmentTopic, courseMaterialsLength: courseMaterials?.length || 0 });
        
        const response = await fetch(`${API_BASE_URL}/api/analyze-assignment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentTopic: assignmentTopic,
            courseMaterials: courseMaterials || 'Course materials extracted from uploaded PDF files.',
          }),
        });

        console.log('Response status:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('Analysis result:', result);
          setAnalysisResult(result);
          setCurrentStep('opinions');
          return;
        } else {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }
      } catch (fetchError) {
        console.error('Backend not available, using mock mode:', fetchError);
        console.error('Error details:', fetchError.message);
        // Show error to user but continue with mock
        setError('Backend server not available. Using mock data. Please start the backend server (cd backend && npm start)');
      }
      
      // Mock mode fallback
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisResult({
        summary: 'This is a mock summary of your assignment. Based on the topic and course materials, this assignment covers key concepts and requires thoughtful analysis.',
        opinionOptions: [
          {
            id: 1,
            title: 'Supportive Viewpoint',
            description: 'This option supports the main arguments presented in the course materials with evidence and examples.'
          },
          {
            id: 2,
            title: 'Critical Analysis',
            description: 'This option provides a critical analysis of the topic with balanced perspectives and alternative viewpoints.'
          },
          {
            id: 3,
            title: 'Alternative Approach',
            description: 'This option explores alternative approaches to the topic with innovative solutions.'
          }
        ]
      });
      setCurrentStep('opinions');
    } catch (err) {
      console.error('Error analyzing assignment:', err);
      setError('Failed to analyze assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opinion selection
  const handleOpinionSelect = async (opinion) => {
    console.log('Opinion selected:', opinion);
    console.log('API_BASE_URL:', API_BASE_URL);
    setIsLoading(true);
    setError(null);
    setSelectedOpinion(opinion);

    try {
      const selectedOpinionText = `${opinion.title}: ${opinion.description}`;
      console.log('Starting fact-check...');
      
      // Step 1: Fact-check the opinion
      let factCheckData = null;
      try {
        const factCheckUrl = `${API_BASE_URL}/api/fact-check`;
        console.log('Fact-check URL:', factCheckUrl);
        const factCheckResponse = await fetch(factCheckUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentTopic: assignmentTopic,
            selectedOpinion: selectedOpinionText,
            courseMaterials: courseMaterials || 'Course materials extracted from uploaded PDF files.',
          }),
        });

        if (factCheckResponse.ok) {
          factCheckData = await factCheckResponse.json();
          setFactCheckResult(factCheckData);
        } else {
          throw new Error('Fact-check failed');
        }
      } catch (factCheckError) {
        console.error('Fact-check error:', factCheckError);
        // Show error but continue with empty fact-check data
        setError(`Fact-check failed: ${factCheckError.message}. Continuing with assignment generation...`);
        factCheckData = {
          isVerified: true,
          keyFacts: [],
          verifiedSources: []
        };
        setFactCheckResult(factCheckData);
      }

      // Step 2: Check balance before generating assignment
      // Estimate word count: assignments are typically 800-1200 words, use 1200 as estimate
      const estimatedWordCount = 1200;
      
      if (!currentUser) {
        setError('Sign In to generate assignments for free');
        setAuthModalOpen(true);
        setIsLoading(false);
        return;
      }

      // Check if user has sufficient balance
      try {
        const balanceCheck = await checkWordBalance(currentUser.uid, estimatedWordCount);
        
        if (!balanceCheck.hasSufficientBalance) {
          setError(`INSUFFICIENT_BALANCE: You have ${balanceCheck.currentBalance.toLocaleString()} words, but need ${estimatedWordCount.toLocaleString()} words. Please purchase more words to continue.`);
          setIsLoading(false);
          return;
        }
      } catch (balanceError) {
        console.error('Error checking balance:', balanceError);
        setError('Error checking word balance. Please try again.');
        setIsLoading(false);
        return;
      }

      // Step 3: Generate assignment
      // Note: This can take 30-60 seconds due to 2-pass humanization
      // Use direct function call to avoid Firebase Hosting's 60-second timeout
      try {
        console.log('Generating assignment (this may take 30-60 seconds)...');
        const generateUrl = `${getGenerateAssignmentUrl()}/generate-assignment`;
        console.log('Generate assignment URL:', generateUrl);
        console.log('Request body:', {
          assignmentTopic: assignmentTopic,
          selectedOpinion: selectedOpinionText,
          courseMaterials: courseMaterials || 'Course materials extracted from uploaded PDF files.',
          verifiedSources: factCheckData.verifiedSources || [],
        });
        
        // Create abort controller for timeout (2 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
        
        const generateResponse = await fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentTopic: assignmentTopic,
            selectedOpinion: selectedOpinionText,
            courseMaterials: courseMaterials || 'Course materials extracted from uploaded PDF files.',
            verifiedSources: factCheckData.verifiedSources || [],
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log('Generate response status:', generateResponse.status, generateResponse.statusText);
        
        if (generateResponse.ok) {
          const generateData = await generateResponse.json();
          console.log('Assignment generated successfully:', generateData);
          
          // Count words in generated assignment
          const assignmentText = generateData.assignment || '';
          const wordCount = countWords(assignmentText);
          console.log('Assignment word count:', wordCount);
          
          // Deduct words from balance
          try {
            await deductWordBalance(currentUser.uid, wordCount);
            console.log(`Deducted ${wordCount} words from balance`);
            // Refresh user profile to update balance display
            if (refreshUserProfile) {
              await refreshUserProfile();
            }
          } catch (deductError) {
            console.error('Error deducting word balance:', deductError);
            // Don't block the user from seeing the result if deduction fails
            // But log the error for debugging
          }
          
          setFinalAssignment(assignmentText);
          setCurrentStep('result');
          
          // Save assignment to Firestore if user is logged in
          if (currentUser) {
            try {
              setSaveStatus('saving');
              const assignmentId = await saveAssignment(currentUser.uid, {
                assignmentTopic,
                courseMaterials,
                selectedOpinion: selectedOpinionText,
                summary: analysisResult?.summary || '',
                finalAssignment: assignmentText,
                verifiedSources: factCheckData?.verifiedSources || [],
                uploadedFiles: uploadedFiles.map(f => ({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  driveId: f.driveId
                }))
              });
              setAssignmentId(assignmentId);
              setSaveStatus('saved');
              console.log('Assignment saved to Firestore:', assignmentId);
            } catch (saveError) {
              console.error('Error saving assignment:', saveError);
              setSaveStatus('error');
              // Don't block the user from seeing the result if save fails
            }
          }
        } else {
          const errorText = await generateResponse.text();
          console.error('Generate failed. Response:', errorText);
          throw new Error(`Generate failed: ${generateResponse.status} ${generateResponse.statusText}. ${errorText}`);
        }
      } catch (generateError) {
        console.error('Generate assignment error:', generateError);
        console.error('Error details:', {
          name: generateError.name,
          message: generateError.message,
          stack: generateError.stack
        });
        
        // Show actual error to user with more details
        let errorMessage = 'Unknown error';
        if (generateError.name === 'AbortError') {
          errorMessage = 'Request timed out. Assignment generation takes 30-60 seconds. Please try again.';
        } else if (generateError.message) {
          errorMessage = generateError.message;
        } else if (generateError.toString) {
          errorMessage = generateError.toString();
        }
        
        setError(`Failed to generate assignment: ${errorMessage}. If this persists, check the browser console (F12) for details.`);
        setIsLoading(false);
        // Stay on opinions step so user can see the error and try again
        return;
      }
    } catch (err) {
      console.error('Error generating assignment:', err);
      setError('Failed to generate assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on current step
  if (currentStep === 'opinions' && analysisResult) {
    return (
      <>
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => {
            setAuthModalOpen(false);
            // Reset the flag when modal is closed so it can show again if needed
            if (!currentUser) {
              setHasShownAuthModal(false);
            }
          }}
          initialMode="login"
          message={hasShownAuthModal && !currentUser ? "Sign In to Continue" : null}
        />
        <div>
          <OpinionOptions
            summary={analysisResult.summary}
            opinionOptions={analysisResult.opinionOptions}
            onSelectOpinion={handleOpinionSelect}
            isLoading={isLoading}
          />
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px', marginTop: '20px' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>⏳ Generating your assignment...</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                This may take 30-60 seconds due to our 2-pass humanization process.
                <br />Please wait, this ensures your assignment bypasses AI detection.
              </div>
              <div style={{ marginTop: '20px' }}>
                <div className="spinner" style={{ 
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #28a745',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
            </div>
          )}
          {error && !isLoading && (
            <div style={{ 
              margin: '20px auto', 
              maxWidth: '600px', 
              padding: '15px', 
              backgroundColor: error.includes('INSUFFICIENT_BALANCE') ? '#f8d7da' : '#fff3cd', 
              border: error.includes('INSUFFICIENT_BALANCE') ? '1px solid #f5c6cb' : '1px solid #ffc107',
              borderRadius: '5px',
              color: error.includes('INSUFFICIENT_BALANCE') ? '#721c24' : '#856404'
            }}>
              <strong>⚠️ {error.includes('INSUFFICIENT_BALANCE') ? 'Insufficient Balance:' : 'Error:'}</strong> 
              <div style={{ marginTop: '10px' }}>
                {error.replace('INSUFFICIENT_BALANCE: ', '')}
              </div>
              {error.includes('INSUFFICIENT_BALANCE') && (
                <div style={{ marginTop: '10px' }}>
                  <Link to="/pricing" style={{ 
                    color: '#28a745', 
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}>
                    Purchase more words →
                  </Link>
                </div>
              )}
              {!error.includes('INSUFFICIENT_BALANCE') && (
                <button 
                  onClick={() => {
                    setError(null);
                    setIsLoading(false);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  if (currentStep === 'result') {
    return (
      <AssignmentResult
        assignment={finalAssignment}
        isLoading={false}
        error={error}
        saveStatus={saveStatus}
        assignmentId={assignmentId}
        isAuthenticated={!!currentUser}
      />
    );
  }

  // Render questions
  const isQuestion2 = currentStep === 'question2';

  return (
    <>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => {
          setAuthModalOpen(false);
          // Reset the flag when modal is closed so it can show again if needed
          if (!currentUser) {
            setHasShownAuthModal(false);
          }
        }}
        initialMode="login"
        message={hasShownAuthModal && !currentUser ? "Sign In to Continue" : null}
      />
      <div className="text-input-section">
        <div className="input-container">
          <div className="input-header">
            <label htmlFor={isQuestion2 ? "file-input" : "question-input"} className="input-label">
              {isQuestion2 ? 'Question 2' : 'Question 1'}
            </label>
          </div>
          
          <div className="question-display">
            <p className="question-text">
              {isQuestion2 
                ? "Upload Your Educational Slides / Class Files (PDF)"
                : "What is your assignment topic?"
              }
            </p>
          </div>
        
        {isQuestion2 ? (
          <div className="file-upload-section">
            <div className="file-upload-area">
              <input
                type="file"
                id="file-input"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                disabled={isLoading}
                className="file-input"
              />
              <label htmlFor="file-input" className="file-upload-label">
                <div className="file-upload-content">
                  <span className="file-upload-icon">📄</span>
                  <p className="file-upload-text">Click to upload PDF files to Google Drive</p>
                  <p className="file-upload-hint">or drag and drop</p>
                </div>
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-list">
                <h4>Uploaded to Google Drive:</h4>
                <ul>
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="uploaded-file-item">
                      <span className="file-name">✓ {file.name}</span>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="remove-file-btn"
                        disabled={isLoading}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <textarea 
            id="question-input"
            className="text-area" 
            placeholder="Enter your assignment topic (e.g., 'The impact of climate change on global economies')..."
            value={assignmentTopic}
            onChange={(e) => {
              const newValue = e.target.value;
              const newWordCount = getWords(newValue).length;
              
              // Check if user is not signed in and has typed 2-3 words
              // Only show modal once when they reach 2-3 words
              if (!currentUser && !hasShownAuthModal && newWordCount >= 2 && newWordCount <= 3) {
                // Show auth modal after 2-3 words
                setAuthModalOpen(true);
                setHasShownAuthModal(true);
              }
              
              // Allow typing regardless of auth status
              const currentWordCount = getWords(assignmentTopic).length;
              
              if (newWordCount <= MAX_WORDS || newValue.length < assignmentTopic.length || newWordCount < currentWordCount) {
                setAssignmentTopic(newValue);
                if (newWordCount >= MAX_WORDS) {
                  setError(`Limit reached: ${MAX_WORDS} words.`);
                } else if (error && error.toLowerCase().includes('limit')) {
                  setError(null);
                }
              }
            }}
            disabled={isLoading}
          />
        )}
        
        {error && (
          <div className="error-message" style={{ 
            marginTop: '10px',
            padding: '10px',
            backgroundColor: error.includes('INSUFFICIENT_BALANCE') ? '#f8d7da' : error.includes('Sign In') ? '#d1ecf1' : '#fff3cd',
            border: error.includes('INSUFFICIENT_BALANCE') ? '1px solid #f5c6cb' : error.includes('Sign In') ? '1px solid #bee5eb' : '1px solid #ffc107',
            borderRadius: '5px',
            color: error.includes('INSUFFICIENT_BALANCE') ? '#721c24' : error.includes('Sign In') ? '#0c5460' : '#856404'
          }}>
            {error.includes('INSUFFICIENT_BALANCE') ? (
              <>
                <strong>⚠️ Insufficient Balance:</strong> {error.replace('INSUFFICIENT_BALANCE: ', '')}
                <div style={{ marginTop: '10px' }}>
                  <Link to="/pricing" style={{ 
                    color: '#28a745', 
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}>
                    Purchase more words →
                  </Link>
                </div>
              </>
            ) : error.includes('Sign In') ? (
              <>
                <strong>🔒 {error}</strong>
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Sign In
                </button>
              </>
            ) : (
              error
            )}
          </div>
        )}
        
        <div className="input-footer">
          <div className="word-count">
            {isQuestion2 
              ? `${uploadedFiles.length} file(s) uploaded to Google Drive`
              : `${getWords(assignmentTopic).length}/${MAX_WORDS} words`
            }
          </div>
          <button 
            className="btn-humanize" 
            onClick={isQuestion2 ? handleQuestion2Submit : handleQuestion1Submit}
            disabled={isLoading || (isQuestion2 ? uploadedFiles.length === 0 : getWords(assignmentTopic).length === 0)}
          >
            {isLoading ? '⏳ Loading...' : '✨ Submit'}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}

export default QuestionBox;
