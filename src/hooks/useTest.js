import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function useTest() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [test, setTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);

  // Start a new test
  const startTest = useCallback(async (testId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start test');
      }

      const data = await response.json();
      setTest(data.test);
      setUserAnswers(data.answers || {});
      setTimeSpent(data.timeSpent || 0);
      
      return data.test;
    } catch (err) {
      console.error('Error starting test:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message || 'Failed to start test',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save test progress
  const saveProgress = useCallback(async (testId, answers, currentTimeSpent) => {
    try {
      const response = await fetch(`/api/tests/${testId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent: currentTimeSpent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save progress:', errorData);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error saving progress:', err);
      return false;
    }
  }, []);

  // Submit test
  const submitTest = useCallback(async (testId, answers, timeSpent) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tests/${testId}/submit`, {
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

      const results = await response.json();
      setTestResults(results);
      
      toast({
        title: 'Test submitted successfully',
        description: `You scored ${results.score}%`,
      });
      
      return results;
    } catch (err) {
      console.error('Error submitting test:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit test',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get test results
  const getTestResults = useCallback(async (testId, attemptId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tests/${testId}/results/${attemptId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test results');
      }

      const results = await response.json();
      setTestResults(results);
      setTest(results.test);
      setUserAnswers(results.answers || {});
      setTimeSpent(results.timeSpent || 0);
      
      return results;
    } catch (err) {
      console.error('Error fetching test results:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch test results',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // List user's test attempts
  const listTestAttempts = useCallback(async (testId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tests/${testId}/attempts`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test attempts');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching test attempts:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch test attempts',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset test state
  const resetTest = useCallback(() => {
    setTest(null);
    setTestResults(null);
    setUserAnswers({});
    setTimeSpent(0);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    test,
    testResults,
    userAnswers,
    timeSpent,
    
    // Actions
    startTest,
    saveProgress,
    submitTest,
    getTestResults,
    listTestAttempts,
    resetTest,
    
    // Setters
    setUserAnswers,
    setTimeSpent,
  };
}
