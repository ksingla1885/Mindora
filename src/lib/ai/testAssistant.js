'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useTestAssistant = (testId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  const analyzePerformance = async (testResults) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/analyze-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          results: testResults,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze performance');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      return data;
    } catch (error) {
      console.error('Error analyzing performance:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze test performance. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionExplanation = async (questionId, userAnswer) => {
    try {
      setIsExplaining(true);
      const response = await fetch('/api/ai/explain-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          userAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      setExplanation(data.explanation || 'No explanation available.');
      return data.explanation;
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast({
        title: 'Error',
        description: 'Failed to get explanation. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsExplaining(false);
    }
  };

  const generateStudyPlan = async (weakAreas) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/generate-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          weakAreas,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate study plan');
      }

      const data = await response.json();
      return data.studyPlan;
    } catch (error) {
      console.error('Error generating study plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate study plan. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalizedTips = async (userId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/personalized-tips?userId=${userId}&testId=${testId}`);

      if (!response.ok) {
        throw new Error('Failed to get personalized tips');
      }

      const data = await response.json();
      return data.tips;
    } catch (error) {
      console.error('Error getting personalized tips:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getAnswerFeedback = async (questionId, userAnswer, correctAnswer) => {
    try {
      const response = await fetch('/api/ai/answer-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          userAnswer,
          correctAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer feedback');
      }

      const data = await response.json();
      return data.feedback;
    } catch (error) {
      console.error('Error getting answer feedback:', error);
      return 'Feedback not available at the moment.';
    }
  };

  return {
    isLoading,
    isExplaining,
    suggestions,
    explanation,
    analyzePerformance,
    getQuestionExplanation,
    generateStudyPlan,
    getPersonalizedTips,
    getAnswerFeedback,
  };
};
