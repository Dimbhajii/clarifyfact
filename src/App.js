import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './unAuth/LandingPage';
import QuestionPage from './unAuth/QuestionPage';
import Pricing from './unAuth/components/Pricing';
import EthicalUsage from './unAuth/components/EthicalUsage';
import TermsOfService from './unAuth/components/TermsOfService';
import AssignmentHistory from './unAuth/components/AssignmentHistory';
import ScrollToTop from './ScrollToTop';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/starter" element={<QuestionPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/ethical-usage" element={<EthicalUsage />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/my-assignments" element={<AssignmentHistory />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
