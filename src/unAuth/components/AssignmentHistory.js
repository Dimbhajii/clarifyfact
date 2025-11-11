import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAssignments, getAssignment, deleteAssignment } from '../../services/databaseService';
import NavBar from './NavBar';
import Footer from '../../Footer';
import './AssignmentHistory.css';

function AssignmentHistory() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadAssignments();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [currentUser]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const userAssignments = await getUserAssignments(currentUser.uid);
      setAssignments(userAssignments);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = async (assignmentId) => {
    try {
      const assignment = await getAssignment(assignmentId);
      setSelectedAssignment(assignment);
    } catch (err) {
      console.error('Error loading assignment:', err);
      alert('Failed to load assignment details.');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    try {
      await deleteAssignment(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      if (selectedAssignment && selectedAssignment.id === assignmentId) {
        setSelectedAssignment(null);
      }
      alert('Assignment deleted successfully.');
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert('Failed to delete assignment.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div>
        <NavBar />
        <div className="assignment-history-container">
          <div className="auth-required">
            <h2>Please Sign In</h2>
            <p>You need to be signed in to view your assignment history.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="assignment-history-container">
          <div className="loading">Loading your assignments...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <div>
        <NavBar />
        <div className="assignment-history-container">
          <button className="back-btn" onClick={() => setSelectedAssignment(null)}>
            ← Back to History
          </button>
          <div className="assignment-detail">
            <h2>{selectedAssignment.assignmentTopic}</h2>
            <p className="assignment-date">
              Created: {formatDate(selectedAssignment.createdAt)}
            </p>
            {selectedAssignment.summary && (
              <div className="detail-section">
                <h3>Summary</h3>
                <p>{selectedAssignment.summary}</p>
              </div>
            )}
            {selectedAssignment.selectedOpinion && (
              <div className="detail-section">
                <h3>Selected Opinion</h3>
                <p>{selectedAssignment.selectedOpinion}</p>
              </div>
            )}
            <div className="detail-section">
              <h3>Generated Assignment</h3>
              <div className="assignment-text">
                {selectedAssignment.finalAssignment?.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            {selectedAssignment.verifiedSources && selectedAssignment.verifiedSources.length > 0 && (
              <div className="detail-section">
                <h3>Verified Sources</h3>
                <ul>
                  {selectedAssignment.verifiedSources.map((source, index) => (
                    <li key={index}>
                      <strong>{source.title}</strong>
                      {source.author && <> - {source.author}</>}
                      {source.description && <p>{source.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="detail-actions">
              <button
                className="delete-btn"
                onClick={() => handleDeleteAssignment(selectedAssignment.id)}
              >
                Delete Assignment
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="assignment-history-container">
        <div className="history-header">
          <h2>My Assignments</h2>
          <p>View and manage your generated assignments</p>
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {assignments.length === 0 ? (
          <div className="empty-state">
            <p>You haven't generated any assignments yet.</p>
            <p>Start by creating a new assignment on the home page!</p>
          </div>
        ) : (
          <div className="assignments-list">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-card-header">
                  <h3>{assignment.assignmentTopic}</h3>
                  <span className="assignment-date">
                    {formatDate(assignment.createdAt)}
                  </span>
                </div>
                {assignment.summary && (
                  <p className="assignment-summary">
                    {assignment.summary.substring(0, 150)}...
                  </p>
                )}
                <div className="assignment-card-actions">
                  <button
                    className="view-btn"
                    onClick={() => handleViewAssignment(assignment.id)}
                  >
                    View Assignment
                  </button>
                  <button
                    className="delete-btn-small"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default AssignmentHistory;
