'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Lazy load the TestResults component
const TestResults = dynamic(() => import('./TestResults'), { ssr: false });
// Import ErrorBoundary with dynamic import if needed
const ErrorBoundary = dynamic(() => import('./ErrorBoundary'), { ssr: false });
import TestTimer from './TestTimer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function TestInterface({ test, attemptId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testStartTime] = useState(Date.now());
  const [error, setError] = useState(null);
  const testFormRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testData, setTestData] = useState(test);
  
  const totalQuestions = testData.questions.length;
  const currentQuestion = testData.questions[currentQuestionIndex]?.question;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const hasAnswered = answers[currentQuestion?.id] !== undefined;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  // Check if test was already submitted
  useEffect(() => {
    const loadTestData = async () => {
      try {
        // Check if test is already submitted
        const response = await fetch(`/api/tests/${test.id}/attempts/${attemptId}`);
        if (!response.ok) throw new Error('Failed to load test data');
        
        const data = await response.json();
        
        if (data.status === 'submitted') {
          setIsTestSubmitted(true);
          toast.info('This test has already been submitted');
          router.push(`/tests/${test.id}/results/${attemptId}`);
          return;
        }
        
        // Load saved answers
        if (data.answers) {
          const savedAnswers = {};
          data.answers.forEach(item => {
            savedAnswers[item.questionId] = item.answer;
          });
          setAnswers(savedAnswers);
        }
        
        // Set time spent if resuming
        if (data.timeSpent) {
          const timeSpent = Math.floor((Date.now() - data.timeSpent) / 1000);
          setTestData(prev => ({
            ...prev,
            ...data.test,
            questions: data.test.questions || prev.questions
          }));
        }
        
      } catch (error) {
        console.error('Error loading test data:', error);
        toast.error('Failed to load test. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTestData();
    
    // Warn before leaving page
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your test progress will be saved, but are you sure you want to leave?';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [test.id, attemptId, router]);
  
  // Auto-save progress when answers change
  const autoSaveProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/tests/${testData.id}/attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
          timeSpent: Math.floor((Date.now() - testStartTime) / 1000),
          currentQuestionIndex,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Auto-save failed');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [answers, testStartTime, currentQuestionIndex, testData.id, attemptId]);
  
  // Debounced auto-save
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    
    const timer = setTimeout(() => {
      autoSaveProgress();
    }, 2000); // 2 second debounce
    
    return () => clearTimeout(timer);
  }, [answers, autoSaveProgress]);
  
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      
      // Auto-save when answer changes
      setTimeout(() => {
        autoSaveProgress();
      }, 500);
      
      return newAnswers;
    });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Scroll to top of question
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleSubmitTest = async () => {
    if (isSubmitting || isTestSubmitted) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate time spent in seconds
      const timeSpent = Math.floor((Date.now() - testStartTime) / 1000);

      const response = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit test');
      }

      const result = await response.json();
      
      setTestResults(result);
      setIsTestSubmitted(true);
      
      // Scroll to top to show results
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast.success('Test submitted successfully!', {
        description: `You scored ${result.score} out of ${result.maxScore} (${result.percentage}%)`,
      });
      
      // Update URL to include attempt ID for sharing/bookmarking
      router.replace(`/tests/${test.id}/results/${result.attemptId}`, { scroll: false });
      
    } catch (err) {
      console.error('Error submitting test:', err);
      setError(err);
      toast.error('Failed to submit test', {
        description: err.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter to submit form
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (testFormRef.current) {
          testFormRef.current.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle time up from TestTimer
  const handleTimeUp = useCallback(() => {
    toast.warning('Time is up! Submitting your test...');
    if (!currentQuestion) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading question...</p>
          </div>
        </div>
      );
    }
    handleSubmitTest();
  }, [handleSubmitTest, currentQuestion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isTestSubmitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-green-600 mb-4">Test Submitted Successfully!</h1>
          <p className="text-gray-600 mb-8">
            Your test has been submitted. You can view your results now.
          </p>
          <Button 
            onClick={() => router.push(`/tests/${testData.id}/results/${attemptId}`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            View Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 relative" ref={testFormRef}>
      {/* Test Timer */}
      <TestTimer 
        initialTimeInSeconds={testData.duration * 60} // Convert minutes to seconds
        onTimeUp={handleTimeUp}
        testId={testData.id}
        attemptId={attemptId}
      />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{testData.title}</h1>
          <div className="text-lg font-semibold">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
        
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            Progress: {currentQuestionIndex + 1}/{totalQuestions} questions
          </span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
        <div className="text-right">
          <div className="text-lg font-medium">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          <div className="text-sm text-gray-500">
            {test.durationMinutes} minute test
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <form id="test-form" onSubmit={(e) => {
          e.preventDefault();
          if (isLastQuestion) {
            handleSubmitTest();
          } else {
            handleNextQuestion();
          }
        }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {currentQuestion.text}
            </h2>
            
            {currentQuestion.type === 'MCQ' ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="radio"
                      id={`option-${currentQuestion.id}-${index}`}
                      name={`answer-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label 
                      htmlFor={`option-${currentQuestion.id}-${index}`}
                      className="ml-3 block text-gray-700"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  id={`answer-${currentQuestion.id}`}
                  name={`answer-${currentQuestion.id}`}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-between mt-8 space-x-4">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              variant="outline"
              className="min-w-[120px]"
            >
              ← Previous
            </Button>
            
            <div className="flex space-x-2">
              {!isLastQuestion && (
                <Button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  Skip →
                </Button>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {!isFirstQuestion && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={isSubmitting || isTestSubmitted}
                    className="w-full sm:w-auto"
                  >
                    ← Previous
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={isSubmitting || isTestSubmitted}
                  className={`min-w-[150px] w-full sm:w-auto ${
                    isLastQuestion 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isLastQuestion ? 'Submitting...' : 'Saving...'}
                    </>
                  ) : isLastQuestion ? (
                    'Submit Test'
                  ) : (
                    'Save & Next →'
                  )}
                </Button>
                
                {!isLastQuestion && (
                  <div className="text-xs text-gray-500 mt-2 sm:mt-0 sm:ml-2 flex items-center">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">Ctrl</kbd> + 
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">Enter</kbd> to save
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
      {/* Question navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 mt-8">
        <h3 className="text-lg font-medium mb-4">Question Navigation</h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
          {test.questions.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCurrentQuestionIndex(index);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`h-10 w-10 flex items-center justify-center rounded-md ${
                currentQuestionIndex === index
                  ? 'bg-blue-600 text-white'
                  : answers[test.questions[index]?.questionId] !== undefined
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-1"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 mr-1"></div>
            <span>Unanswered</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-1"></div>
            <span>Current</span>
          </div>
        </div>
      </div>
      
      {/* Submit button for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
        <button
          type="button"
          onClick={handleSubmitTest}
          disabled={isSubmitting}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
}
