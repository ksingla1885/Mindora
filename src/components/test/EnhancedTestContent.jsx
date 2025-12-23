'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiClock, 
  FiChevronLeft, 
  FiChevronRight, 
  FiSave, 
  FiCheckCircle, 
  FiAlertCircle,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiFlag,
  FiCheckSquare,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import TestTimer from './TestTimer';

// Helper function to format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function EnhancedTestContent({ testId }) {
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [lastSaved, setLastSaved] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testEndTime, setTestEndTime] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const autoSubmitTimeout = useRef(null);

  // Fetch test and attempt data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        // Fetch test details
        const testRes = await fetch(`/api/tests/${testId}`);
        if (!testRes.ok) throw new Error('Failed to load test');
        const testData = await testRes.json();
        setTest(testData);

        // Start or resume test attempt
        const attemptRes = await fetch(`/api/tests/${testId}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });
        
        if (!attemptRes.ok) throw new Error('Failed to start test attempt');
        const attemptData = await attemptRes.json();
        setAttempt(attemptData);
        setTestStartTime(new Date(attemptData.startedAt));
        setTestEndTime(new Date(new Date(attemptData.startedAt).getTime() + testData.duration * 60 * 1000));
        
        // Load questions
        const questionsRes = await fetch(`/api/tests/${testId}/questions`);
        if (!questionsRes.ok) throw new Error('Failed to load questions');
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);
        
        // Load saved answers if any
        if (attemptData.answers) {
          setAnswers(attemptData.answers);
        }
        
        // Load flagged questions
        if (attemptData.flaggedQuestions) {
          setFlaggedQuestions(new Set(attemptData.flaggedQuestions));
        }
        
      } catch (err) {
        console.error('Error loading test:', err);
        setError(err.message || 'Failed to load test');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
    
    // Cleanup function to submit test if user leaves the page
    const handleBeforeUnload = (e) => {
      if (!submitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSubmitTimeout.current) {
        clearTimeout(autoSubmitTimeout.current);
      }
    };
  }, [testId, submitting]);

  // Auto-save answers
  const saveAnswers = useCallback(async () => {
    if (!attempt || submitting) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/tests/${testId}/attempt/${attempt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          flaggedQuestions: Array.from(flaggedQuestions)
        })
      });
      
      if (!res.ok) throw new Error('Failed to save progress');
      
      const data = await res.json();
      setLastSaved(new Date());
      return data;
    } catch (err) {
      console.error('Error saving answers:', err);
      setError('Failed to save your progress. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [answers, attempt, flaggedQuestions, testId, submitting]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Toggle flag for review
  const toggleFlagQuestion = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Navigation between questions
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Handle test submission
  const handleSubmitTest = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Final save before submission
      await saveAnswers();
      
      // Submit the test
      const res = await fetch(`/api/tests/${testId}/attempt/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) throw new Error('Failed to submit test');
      
      const result = await res.json();
      
      // Redirect to results page
      router.push(`/tests/${testId}/results/${result.attemptId}`);
      
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  // Handle time up
  const handleTimeUp = async () => {
    if (!isTimeUp) {
      setIsTimeUp(true);
      // Auto-submit after 5 seconds if user doesn't take action
      autoSubmitTimeout.current = setTimeout(() => {
        handleSubmitTest();
      }, 5000);
    }
  };

  // Calculate test statistics
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const remainingCount = totalQuestions - answeredCount;
  const flaggedCount = flaggedQuestions.size;

  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!test || !attempt || !currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Test not found or cannot be loaded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Test Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600">Test ID: {testId}</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <TestTimer 
              durationInMinutes={test.duration}
              onTimeUp={handleTimeUp}
              startTime={testStartTime}
              isSubmitted={submitting}
            />
            {lastSaved && (
              <p className="text-xs text-gray-500 text-right mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
                {saving && ' (Saving...)'}
              </p>
            )}
          </div>
        </div>
        
        {/* Test Stats */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <span className="font-medium">Questions:</span>
            <span className="ml-1">{currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Answered:</span>
            <span className="ml-1">{answeredCount} / {totalQuestions}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Flagged:</span>
            <span className="ml-1">{flaggedCount}</span>
          </div>
        </div>
      </div>
      
      {/* Test Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Questions Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg p-4 sticky top-4">
            <h3 className="font-medium text-gray-900 mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = currentQuestionIndex === index;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium
                      ${isCurrent 
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                        : isAnswered 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'}
                      ${isFlagged && 'ring-2 ring-yellow-400 ring-offset-1'}
                      hover:bg-blue-50 hover:border-blue-300 transition-colors`}
                    title={isFlagged ? 'Flagged for review' : ''}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></div>
                <span className="text-sm text-gray-600">Answered</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 mr-2"></div>
                <span className="text-sm text-gray-600">Unanswered</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-2 ring-2 ring-yellow-400 ring-offset-1"></div>
                <span className="text-sm text-gray-600">Flagged</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
              
              <button
                onClick={saveAnswers}
                disabled={saving || submitting}
                className="mt-3 w-full py-2 px-4 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Question Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </h3>
                {flaggedQuestions.has(currentQuestion.id) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                    <FiFlag className="mr-1" /> Flagged for review
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={`p-2 rounded-full ${flaggedQuestions.has(currentQuestion.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
                title={flaggedQuestions.has(currentQuestion.id) ? 'Unflag question' : 'Flag for review'}
              >
                <FiFlag />
              </button>
            </div>
            
            <div className="prose max-w-none mb-8">
              <p className="text-gray-800 text-lg">{currentQuestion.text}</p>
              
              {currentQuestion.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt="Question diagram" 
                    className="max-w-full h-auto rounded border border-gray-200"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options && currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                      answers[currentQuestion.id] === index 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-400'
                    }`}>
                      {answers[currentQuestion.id] === index && (
                        <FiCheck className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="text-gray-800">
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-md border ${currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                <FiChevronLeft className="inline mr-1" /> Previous
              </button>
              
              <div className="space-x-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Next <FiChevronRight className="inline ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={submitting}
                    className={`px-4 py-2 ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time's Up Modal */}
      {isTimeUp && !submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiClock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Time's Up!</h3>
              <p className="text-gray-600 mb-6">
                Your test time has ended. Your answers will be automatically submitted in 5 seconds.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={handleSubmitTest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Test?</h3>
              <p className="text-gray-600 mb-6">
                You have {remainingCount} unanswered questions. Are you sure you want to submit the test?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitTest}
                  disabled={submitting}
                  className={`px-4 py-2 border border-transparent rounded-md text-white ${submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
