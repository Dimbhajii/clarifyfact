import React from 'react';
import QuestionBox from './components/QuestionBox';
import NavBar from './components/NavBar';
import Footer from '../Footer';
import './QuestionPage.css';

function QuestionPage() {
  return (
    <div className="question-page">
      <NavBar />
      <div className="question-page-content">
        <QuestionBox maxWords={5000} />
      </div>
      <Footer />
    </div>
  );
}

export default QuestionPage;

