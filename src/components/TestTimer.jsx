'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TestTimer({ initialTimeInSeconds, onTimeUp, testId, attemptId }) {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnedAt, setWarnedAt] = useState({
    fiveMinutes: false,
    oneMinute: false,
    thirtySeconds: false,
    tenSeconds: false
  });
  const router = useRouter();

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show time warning notifications
  const showTimeWarning = useCallback((message, type = 'warning') => {
    toast[type](message, {
      duration: 5000,
      position: 'top-center',
      important: true,
    });
  }, []);

  // Handle auto-submit when time is up
  const submitTest = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Get all answers from the form
      const form = document.getElementById('test-form');
      if (!form) return;
      
      const formData = new FormData(form);
      const answers = [];
      
      // Convert FormData to answers array
      formData.forEach((value, key) => {
        if (key.startsWith('answer-')) {
          const questionId = key.replace('answer-', '');
          answers.push({
            questionId,
            answer: value,
          });
        }
      });
      
      // Submit the test
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId,
          answers,
          timeSpent: initialTimeInSeconds - timeLeft,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit test');
      }
      
      const result = await response.json();
      
      // Redirect to results page
      router.push(`/tests/${testId}/results/${result.attemptId}`);
      
    } catch (error) {
      console.error('Error submitting test:', error);
      // If submission fails, just redirect to test list
      router.push('/tests');
    } finally {
      setIsSubmitting(false);
    }
  }, [initialTimeInSeconds, isSubmitting, router, testId, timeLeft]);

  // Update timer every second
  useEffect(() => {
    // Time warning notifications
    if (timeLeft <= 300 && !warnedAt.fiveMinutes) { // 5 minutes
      showTimeWarning('5 minutes remaining!', 'warning');
      setWarnedAt(prev => ({ ...prev, fiveMinutes: true }));
    } else if (timeLeft <= 60 && !warnedAt.oneMinute) { // 1 minute
      showTimeWarning('1 minute remaining! Hurry up!', 'warning');
      setWarnedAt(prev => ({ ...prev, oneMinute: true }));
    } else if (timeLeft <= 30 && !warnedAt.thirtySeconds) { // 30 seconds
      showTimeWarning('30 seconds remaining!', 'error');
      setWarnedAt(prev => ({ ...prev, thirtySeconds: true }));
    } else if (timeLeft <= 10 && !warnedAt.tenSeconds) { // 10 seconds
      showTimeWarning('10 seconds remaining! Submitting test...', 'error');
      setWarnedAt(prev => ({ ...prev, tenSeconds: true }));
    }

    // Auto-submit when time is up
    if (timeLeft <= 0) {
      onTimeUp?.();
      submitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, submitTest, showTimeWarning, warnedAt]);

  // Auto-save progress periodically
  useEffect(() => {
    const autoSave = async () => {
      const form = document.getElementById('test-form');
      if (!form) return;
      
      const formData = new FormData(form);
      const answers = [];
      
      formData.forEach((value, key) => {
        if (key.startsWith('answer-')) {
          const questionId = key.replace('answer-', '');
          answers.push({
            questionId,
            answer: value,
          });
        }
      });

      try {
        await fetch(`/api/tests/${testId}/attempts/${attemptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers,
            timeSpent: initialTimeInSeconds - timeLeft,
          }),
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const autoSaveInterval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(autoSaveInterval);
  }, [testId, attemptId, initialTimeInSeconds, timeLeft]);

  // Calculate progress percentage
  const progress = ((initialTimeInSeconds - timeLeft) / initialTimeInSeconds) * 100;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 w-64">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Time Remaining:</span>
          <div className={`text-lg font-semibold ${
            timeLeft <= 60 ? 'text-red-600 animate-pulse' : 'text-gray-800'
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              timeLeft <= 60 ? 'bg-red-500' : 
              timeLeft <= 300 ? 'bg-yellow-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%`, transition: 'width 1s linear' }}
          ></div>
        </div>
        
        {/* Auto-save indicator */}
        <div className="flex items-center justify-end">
          <span className="text-xs text-gray-500 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            Auto-saving...
          </span>
        </div>
      </div>
      
      {/* Time warning messages */}
      {timeLeft <= 60 && (
        <div className="mt-2 text-red-600 text-sm font-medium text-center">
          Less than a minute remaining! Submit your answers now!
        </div>
      )}
      {timeLeft > 60 && timeLeft <= 300 && (
        <div className="mt-2 text-yellow-600 text-sm text-center">
          Less than 5 minutes remaining. Please review your answers.
        </div>
      )}
    </div>
  );
}
