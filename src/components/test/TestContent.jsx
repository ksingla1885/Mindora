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

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function TestContent({ testId }) {
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [lastSaved, setLastSaved] = useState(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showQuestionList, setShowQuestionList] = useState(false);
  const saveTimeoutRef = useRef(null);
  const lastSaveTimeRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  // Fetch test and questions
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const [testRes, questionsRes] = await Promise.all([
          fetch(`/api/tests/${testId}`),
          fetch(`/api/tests/${testId}/questions`)
        ]);

        if (!testRes.ok || !questionsRes.ok) {
          throw new Error('Failed to load test');
        }

        const testData = await testRes.json();
        const questionsData = await questionsRes.json();
        
        // Sort questions by sequence if available
        const sortedQuestions = [...questionsData].sort((a, b) => 
          (a.sequence || 0) - (b.sequence || 0)
        );
        
        setTest(testData);
        setQuestions(sortedQuestions);
        
        // Set initial time left (in seconds)
        const initialTimeLeft = testData.duration * 60;
        setTimeLeft(initialTimeLeft);
        
        // Load saved attempt if exists
        const attemptRes = await fetch(`/api/tests/${testId}/attempt`, {
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (attemptRes.ok) {
          const attemptData = await attemptRes.json();
          setAttempt(attemptData);
          
          // Restore answers and flagged questions
          if (attemptData.answers) {
            setAnswers(attemptData.answers);
          }
          
          if (attemptData.flaggedQuestions?.length) {
            setFlaggedQuestions(new Set(attemptData.flaggedQuestions));
          }
          
          // Calculate remaining time
          if (attemptData.startedAt) {
            const timeElapsed = Math.floor((new Date() - new Date(attemptData.startedAt)) / 1000);
            const remainingTime = Math.max(0, initialTimeLeft - timeElapsed);
            setTimeLeft(remainingTime);
          }
        } else if (attemptRes.status === 404) {
          // Create new attempt
          const newAttemptRes = await fetch(`/api/tests/${testId}/attempt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              startedAt: new Date().toISOString()
            })
          });
          
          if (newAttemptRes.ok) {
            const newAttempt = await newAttemptRes.json();
            setAttempt(newAttempt);
          }
        }
        
      } catch (err) {
        console.error('Error loading test:', err);
        setError('Failed to load test. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();

    // Set up periodic auto-save
    autoSaveIntervalRef.current = setInterval(() => {
      if (attempt && Object.keys(answers).length > 0) {
        saveProgress();
      }
    }, 60000); // Auto-save every minute

    // Clean up interval on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      // Save progress when leaving the page
      if (attempt && Object.keys(answers).length > 0 && !submitting) {
        saveProgress(true); // Force save on unmount
      }
    };
  }, [testId]);

  // Timer effect
  useEffect(() => {
    if (!test) return;
    
    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Auto-save every 30 seconds
        if (newTime % 30 === 0 && attempt) {
          saveProgress();
        }
        
        // Show warning when 10 minutes left
        if (newTime === 600) {
          setShowTimeWarning(true);
        }
        
        // Auto-submit when time's up
        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempt]);

  // Save progress to the server
  const saveProgress = useCallback(debounce(async (force = false) => {
    if (!attempt || submitting) return;
    
    // Don't save too frequently (at least 5 seconds between saves)
    const now = Date.now();
    if (!force && lastSaveTimeRef.current && (now - lastSaveTimeRef.current < 5000)) {
      return;
    }
    
    setSaving(true);
    setSaveError('');
    
    try {
      const response = await fetch(`/api/tests/${testId}/attempt/${attempt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answers,
          flaggedQuestions: Array.from(flaggedQuestions),
          timeSpent: (test.duration * 60) - timeLeft
        })
      });
      
      if (response.ok) {
        lastSaveTimeRef.current = now;
        setLastSaved(new Date());
      } else {
        throw new Error('Failed to save progress');
      }
    } catch (err) {
      console.error('Error saving progress:', err);
      setSaveError('Failed to save your progress. Please check your connection.');
    } finally {
      setSaving(false);
    }
  }, 1000), [attempt, answers, flaggedQuestions, testId, timeLeft, test]);

  // Handle answer selection
  const handleAnswerChange = (questionId, answer) => {
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    
    setAnswers(newAnswers);
    
    // Debounced auto-save
    if (attempt) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 2000);
    }
  };
  
  // Toggle question flag
  const toggleFlagQuestion = (questionId) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
    
    // Save flag changes
    if (attempt) {
      saveProgress();
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Save final answers
      await saveProgress();
      
      // Submit the test
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          answers,
          timeSpent: test.duration * 60 - timeLeft
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit test');
      }
      
      const result = await response.json();
      
      // Redirect to results page
      router.push(`/tests/${testId}/results/${result.attemptId}`);
      
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700">Loading test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading test</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-semibold">Time Warning</h3>
            </div>
            <p className="mb-4 text-gray-700">
              Only 5 minutes remaining! Please review your answers and submit before time runs out.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTimeWarning(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Continue Test
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save status indicator */}
      <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full px-4 py-2 text-sm text-gray-600 flex items-center z-10">
        {lastSaved ? (
          <>
            <FiCheckCircle className="text-green-500 mr-2" />
            Saved at {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </>
        ) : (
          <>
            <div className="animate-pulse flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Saving...</span>
            </div>
          </>
        )}
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{test?.title}</h1>
          <p className="text-sm text-gray-600">
            {answeredCount} of {questions.length} questions answered • {flaggedCount} flagged for review
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-blue-100 px-4 py-2 rounded-lg">
            <FiClock className="mr-2 text-blue-600" />
            <span className="font-medium">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <button 
            onClick={() => setShowQuestionList(!showQuestionList)}
            className="md:hidden px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {showQuestionList ? 'Hide Questions' : 'View Questions'}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Navigation - Desktop */}
      <div className="hidden md:block mb-6">
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                currentQuestionIndex === index 
                  ? 'bg-blue-600 text-white border-2 border-blue-700' 
                  : answers[q.id] 
                    ? flaggedQuestions.has(q.id)
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                      : 'bg-green-100 text-green-800 border-2 border-green-400'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300'
              }`}
              title={q.text.substring(0, 50) + (q.text.length > 50 ? '...' : '')}
            >
              {index + 1}
              {flaggedQuestions.has(q.id) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-400 mr-1"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-100 border-2 border-yellow-400 mr-1"></div>
            <span>Flagged</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-200 mr-1"></div>
            <span>Unanswered</span>
          </div>
        </div>
      </div>
      
      {/* Mobile Question List */}
      {showQuestionList && (
        <div className="md:hidden mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Questions</h3>
            <button 
              onClick={() => setShowQuestionList(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => {
                  goToQuestion(index);
                  setShowQuestionList(false);
                }}
                className={`w-full aspect-square rounded flex items-center justify-center relative ${
                  currentQuestionIndex === index
                    ? 'bg-blue-600 text-white'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100'
                }`}
              >
                {index + 1}
                {flaggedQuestions.has(q.id) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">{currentQuestion?.text}</h2>
            <button
              onClick={() => toggleFlagQuestion(currentQuestion.id)}
              className={`p-2 rounded-full ${flaggedQuestions.has(currentQuestion.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
              aria-label={flaggedQuestions.has(currentQuestion.id) ? 'Unflag question' : 'Flag for review'}
            >
              {flaggedQuestions.has(currentQuestion.id) ? <FiFlag className="h-5 w-5 fill-current" /> : <FiFlag className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options?.map((option, idx) => (
              <div 
                key={idx}
                onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQuestion.id] === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center">
                  <div 
                    className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center ${
                      answers[currentQuestion.id] === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}
                  >
                    {answers[currentQuestion.id] === option.id && (
                      <FiCheck className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span>{option.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={handlePreviousQuestion}
            disabled={isFirstQuestion || submitting}
            className={`px-4 py-2 rounded-md flex items-center ${
              isFirstQuestion
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiChevronLeft className="mr-1" /> Previous
          </button>
          
          {isLastQuestion ? (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Test'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              Next <FiChevronRight className="ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t">
        <div className="flex items-center text-sm text-gray-500">
          {lastSaved && (
            <span className="flex items-center">
              <FiCheckCircle className="text-green-500 mr-1" />
              Last saved: {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => toggleFlagQuestion(currentQuestion.id)}
            className={`px-4 py-2 text-sm rounded-md flex items-center justify-center ${
              flaggedQuestions.has(currentQuestion.id)
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {flaggedQuestions.has(currentQuestion.id) ? (
              <>
                <FiFlag className="mr-1 h-4 w-4 fill-current" />
                Flagged
              </>
            ) : (
              <>
                <FiFlag className="mr-1 h-4 w-4" />
                Flag for Review
              </>
            )}
          </button>
          
          <div className="flex gap-2">
            {!isFirstQuestion && (
              <button
                onClick={handlePreviousQuestion}
                disabled={submitting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <FiChevronLeft className="mr-1" /> Previous
              </button>
            )}
            
            {!isLastQuestion ? (
              <button
                onClick={handleNextQuestion}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                Next <FiChevronRight className="ml-1" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Submit Test</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit the test? You won't be able to change your answers after submission.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTest}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
