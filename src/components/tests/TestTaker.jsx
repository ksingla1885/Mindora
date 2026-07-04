'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTestWebSocket } from '@/hooks/useTestWebSocket';
import { useTestProctoring } from '@/hooks/useTestProctoring';
import { useTestAssistant } from '@/lib/ai/testAssistant';
import { TestAnalytics } from '@/components/analytics/TestAnalytics';
import { TestSecurityOverlay } from '@/components/tests/TestSecurityOverlay';
import { TestSecurityBar } from '@/components/tests/TestSecurityBar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Clock, AlertCircle, CheckCircle, Send,
  Flag, FlagOff, Save, AlertTriangle, ChevronLeft,
  ChevronRight, List, X, Check, CheckSquare, Square,
  Shield, Lock, Eye, Keyboard, Copy, Maximize,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  MULTIPLE_RESPONSE: 'MULTIPLE_RESPONSE',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  ESSAY: 'ESSAY',
};

const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPES.MULTIPLE_RESPONSE]: 'Multiple Response',
  [QUESTION_TYPES.TRUE_FALSE]: 'True/False',
  [QUESTION_TYPES.SHORT_ANSWER]: 'Short Answer',
  [QUESTION_TYPES.ESSAY]: 'Essay',
};

export function TestTaker({ test, questions: initialQuestions = [], onComplete, initialAttempt, apiBaseUrl = '/api/test-attempts' }) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const testId = test?.id;

  // State management
  const [attemptId, setAttemptId] = useState(initialAttempt?.id || null);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(test?.durationMinutes * 60 || 1800);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [questions, setQuestions] = useState(initialQuestions);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Proctoring specific states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState(initialAttempt?.status || 'in_progress');
  // Whether the candidate has checked the acknowledgment checkbox on the instruction gate
  const [acknowledgedRules, setAcknowledgedRules] = useState(false);

  // AI Assistant Hook
  const {
    isLoading: isAILoading,
    isExplaining,
    suggestions,
    explanation,
    analyzePerformance,
    getQuestionExplanation,
    generateStudyPlan,
    getPersonalizedTips,
    getAnswerFeedback,
  } = useTestAssistant(test?.id);

  // Keep a ref to the current attemptId to avoid stale closures in callbacks
  const attemptIdRef = useRef(initialAttempt?.id || null);

  // Sync ref with state
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  const handleDisqualification = useCallback((reason) => {
    setIsDisqualified(true);
    setDisqualificationReason(reason || 'Exceeded proctoring violations limit.');
  }, []);

  const handleLogViolation = useCallback(async (violation) => {
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId) return;

    // Show warning modal and increment warning count locally
    setWarningCount(prev => prev + 1);
    setShowWarningModal(true);

    try {
      const response = await fetch(`${apiBaseUrl}/${currentAttemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violation,
          timeSpentSeconds: Math.floor((test?.durationMinutes * 60) - timeLeft),
          currentQuestionIndex,
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Sync the actual violation count from server response
        if (result.attempt?.metadata?.violationCount !== undefined) {
          setWarningCount(result.attempt.metadata.violationCount);
        } else if (result.attempt?.metadata?.violations?.length !== undefined) {
          setWarningCount(result.attempt.metadata.violations.length);
        }

        if (result.disqualified) {
          handleDisqualification(result.disqualificationReason);
        }
      }
    } catch (error) {
      console.error('Failed to log violation to backend:', error);
    }
  }, [timeLeft, currentQuestionIndex, apiBaseUrl, test?.durationMinutes, handleDisqualification]);

  // Proctoring Hook
  const {
    isActive: isProctoringActive,
    isFullscreen,
    violationCount,
    videoRef,
    startProctoring,
    stopProctoring,
  } = useTestProctoring({
    testId: test?.id,
    enableFaceDetection: test?.faceDetectionEnabled ?? false,
    // Enable tab monitoring when the test has any proctoring flag set,
    // or default to true if the fields aren't present (legacy tests).
    enableTabMonitoring:
      test?.tabMonitoringEnabled ??
      test?.proctoringEnabled ??
      true,
    enforceFullscreen: test?.enforceFullscreen ?? true,
    onViolation: handleLogViolation,
  });

  // Proctoring is always started — tab monitoring defaults to true, so we
  // always want to register the visibility/blur event listeners.
  const anyProctoringFeature = true;

  const handleStartTestClick = useCallback(async () => {
    if (anyProctoringFeature) {
      try {
        await startProctoring();
      } catch (err) {
        console.error('Failed to start proctoring:', err);
      }
    }
    setHasStarted(true);
  }, [anyProctoringFeature, startProctoring]);

  // Stop proctoring if disqualified
  useEffect(() => {
    if (isDisqualified) {
      stopProctoring();
    }
  }, [isDisqualified, stopProctoring]);

  // State for analytics and AI features
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [studyPlan, setStudyPlan] = useState(null);
  const [personalizedTips, setPersonalizedTips] = useState([]);

  // Sync state if initialAttempt is provided or changes
  useEffect(() => {
    if (initialAttempt) {
      if (initialAttempt.id && !attemptId) {
        setAttemptId(initialAttempt.id);
      }
      if (initialAttempt.answers && Object.keys(answers).length === 0) {
        setAnswers(initialAttempt.answers);
      }
      if (initialAttempt.metadata?.flaggedQuestions && Object.keys(flaggedQuestions).length === 0) {
        setFlaggedQuestions(initialAttempt.metadata.flaggedQuestions);
      } else if (initialAttempt.details?.flaggedQuestions && Object.keys(flaggedQuestions).length === 0) {
        setFlaggedQuestions(initialAttempt.details.flaggedQuestions);
      }
      if (initialAttempt.timeRemaining) {
        setTimeLeft(initialAttempt.timeRemaining);
      }
    }
  }, [initialAttempt, attemptId, answers, flaggedQuestions]);

  // Initialize WebSocket connection
  const { sendAnswerUpdate, isConnected } = useTestWebSocket(test?.id, (data) => {
    // Handle real-time updates from other clients (e.g., proctors)
    if (data.type === 'proctor-message') {
      toast({
        title: 'Proctor Message',
        description: data.message,
        variant: 'default',
      });
    }
  });

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Refs
  const timerRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const questionTimerRef = useRef(null);
  const mainContentRef = useRef(null);
  const isInitializing = useRef(false);

  // Derived state
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const timeWarning = timeLeft < 300; // 5 minutes left
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Initialize test attempt
  const initializeTest = useCallback(async () => {
    // Basic guards
    if (!test?.id || isInitializing.current) {
      if (!test?.id) setIsLoading(false);
      return;
    }

    // Wait for session to load if not yet available
    if (session === undefined) {
      console.log('TestTaker: Waiting for session to load...');
      return;
    }

    // If unauthenticated, the API will handle it, but we can catch it early here 
    // to avoid unnecessary requests if we know it's unauthenticated.
    if (!session?.user?.id) {
       console.warn('TestTaker: No user session found');
       // But let's proceed to the API anyway just in case NextAuth state is laggy
    }

    try {
      isInitializing.current = true;
      setIsLoading(true);
      
      let attemptData = initialAttempt;
      let newAttemptId = attemptId;

      // Use attemptId if already available in state/ref or props
      if (!newAttemptId) newAttemptId = attemptIdRef.current;
      if (newAttemptId && !attemptData) {
        attemptData = { id: newAttemptId };
      } else if (attemptData && attemptData.id) {
        newAttemptId = attemptData.id;
        attemptIdRef.current = newAttemptId;
        setAttemptId(newAttemptId);
      }

      if (!attemptData) {
        // Create test attempt if not provided
        const attemptRes = await fetch(apiBaseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: test.id,
            userId: session?.user?.id,
            startTime: new Date().toISOString()
          })
        });

        if (!attemptRes.ok) {
          const errorData = await attemptRes.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to start test attempt');
        }

        const response = await attemptRes.json();
        const attemptDataRaw = response.attempt || response.data || response;
        
        if (!attemptDataRaw || !attemptDataRaw.id) {
          console.error('API response missing attempt ID:', response);
          throw new Error('API failed to return a valid test session ID');
        }

        attemptData = attemptDataRaw;
        newAttemptId = attemptData.id;
        attemptIdRef.current = newAttemptId;
        setAttemptId(newAttemptId);
        console.log('TestTaker: Created/Resumed attempt', newAttemptId);
      }

      setAttemptStatus(attemptData.status || 'in_progress');

      // Calculate remaining time if resuming
      if (attemptData.startedAt) {
        const startTime = new Date(attemptData.startedAt).getTime();
        const durationMs = test.durationMinutes * 60 * 1000;
        const elapsedMs = Date.now() - startTime;
        const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
        setTimeLeft(remainingSeconds);
      } else {
        setTimeLeft(test.durationMinutes * 60);
      }

      setAnswers(attemptData.answers || {});
      setFlaggedQuestions(attemptData.metadata?.flaggedQuestions || attemptData.flaggedQuestions || {});
      setTimeSpent(attemptData.timeSpent || {});
      setCurrentQuestionIndex(attemptData.details?.currentQuestionIndex || 0);

      // Load initial violation count and check if disqualified
      const initialViolationsCount = attemptData.metadata?.violationCount || attemptData.metadata?.violations?.length || 0;
      setWarningCount(initialViolationsCount);

      if (attemptData.status === 'disqualified') {
        setIsDisqualified(true);
        setDisqualificationReason(attemptData.metadata?.disqualificationReason || 'Exceeded proctoring violations limit.');
      }

      console.log('TestTaker: Initializing', { testId: test?.id, questionsLength: questions.length });

      // Load questions if not provided
      if (questions.length === 0) {
        console.log('TestTaker: No questions provided, fetching from API...');
        // If questions are part of the test object, use them
        if (test.questions && test.questions.length > 0) {
          console.log('TestTaker: Found questions in test object', test.questions);
          const mappedQuestions = test.questions.map(q => {
            let type = q.type;
            if (type === 'mcq') type = QUESTION_TYPES.MULTIPLE_CHOICE;
            else if (type === 'short_answer') type = QUESTION_TYPES.SHORT_ANSWER;
            else if (type === 'long_answer') type = QUESTION_TYPES.ESSAY;
            return { ...q, type };
          });
          setQuestions(mappedQuestions);
        } else {
          console.log(`TestTaker: Fetching from /api/tests/${test.id}`);
          const questionsRes = await fetch(`/api/tests/${test.id}`);

          if (!questionsRes.ok) {
            console.error('TestTaker: API fetch failed', questionsRes.status);
            throw new Error('Failed to load questions');
          }

          const responseData = await questionsRes.json();
          console.log('TestTaker: API Response', responseData);

          if (responseData.success && responseData.data.testQuestions && responseData.data.testQuestions.length > 0) {
            const mappedQuestions = responseData.data.testQuestions.map(tq => {
              let type = tq.question.type;
              if (type === 'mcq') type = QUESTION_TYPES.MULTIPLE_CHOICE;
              else if (type === 'short_answer') type = QUESTION_TYPES.SHORT_ANSWER;
              else if (type === 'long_answer') type = QUESTION_TYPES.ESSAY;

              return {
                ...tq.question,
                type,
                question: tq.question.text || tq.question.question
              };
            });
            console.log('TestTaker: Mapped questions', mappedQuestions);
            setQuestions(mappedQuestions);
          } else {
            console.warn('TestTaker: No questions found in API response');
            setQuestions([]);
          }
        }
      } else {
        console.log('TestTaker: Questions already provided', questions);
      }

    } catch (error) {
      console.error('Test initialization failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start test. Please try again.',
        variant: 'destructive',
      });
      // Don't redirect immediately on error, let user try again or see error
    } finally {
      setIsLoading(false);
      isInitializing.current = false;
    }
  }, [test?.id, session?.user?.id, initialAttempt, apiBaseUrl]);

  // Timer logic
  useEffect(() => {
    if (!attemptId) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId]);

  // Auto-save answers with debounce
  const saveAnswers = useCallback(async () => {
    if (!attemptId || isSubmitting) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set auto-saved state for UI feedback (reset current status)
    setAutoSaved(false);

    // Debounce the save to avoid too many requests
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/${attemptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers,
            timeSpentSeconds: Math.floor((test.durationMinutes * 60) - timeLeft),
            currentQuestionIndex,
          })
        });

        if (!response.ok) throw new Error('Save failed');

        const result = await response.json();
        if (result.success) {
          setAutoSaved(true);
          // Briefly show auto-saved indicator then hide it
          setTimeout(() => setAutoSaved(false), 3000);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);
  }, [attemptId, answers, timeLeft, currentQuestionIndex, apiBaseUrl, isSubmitting, test.durationMinutes]);

  // Handle test completion with analytics
  const handleTestCompletion = useCallback(async (results) => {
    try {
      setIsSubmitting(true);
      setTestResults(results);

      // Analyze performance using AI
      const analysis = await analyzePerformance(results);
      if (analysis) {
        setAiFeedback(analysis);

        // Get personalized tips if user is logged in
        if (session?.user?.id) {
          const tips = await getPersonalizedTips(session.user.id);
          setPersonalizedTips(tips || []);
        }

        // Generate study plan for weak areas
        const weakAreas = analysis.suggestions
          .filter(s => s.priority === 'high')
          .map(s => s.topic);

        if (weakAreas.length > 0) {
          const plan = await generateStudyPlan(weakAreas);
          setStudyPlan(plan);
        }
      }

      setShowTestResults(true);
      onComplete?.(results);
    } catch (error) {
      console.error('Error completing test:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete test analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [analyzePerformance, generateStudyPlan, getPersonalizedTips, onComplete, session?.user?.id]);

  // Handle getting explanation for a question
  const handleGetExplanation = useCallback(async (questionId) => {
    try {
      setShowExplanation(true);
      setCurrentExplanation('Loading explanation...');

      const userAnswer = answers[questionId];
      const explanation = await getQuestionExplanation(questionId, userAnswer);

      if (explanation) {
        setCurrentExplanation(explanation);
      }
    } catch (error) {
      console.error('Error getting explanation:', error);
      setCurrentExplanation('Failed to load explanation. Please try again.');
    }
  }, [answers, getQuestionExplanation]);

  // Handle answer selection with WebSocket and Redis persistence
  const handleAnswer = useCallback((questionId, value, questionType) => {
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: value
      };

      // Track time spent on question
      const now = Date.now();
      const timeSpentMs = now - questionStartTime;
      const updatedTimeSpent = (timeSpent[questionId] || 0) + Math.floor(timeSpentMs / 1000);

      // Update local state
      setTimeSpent(prev => ({
        ...prev,
        [questionId]: updatedTimeSpent
      }));

      // Send real-time update via WebSocket
      if (isConnected) {
        sendAnswerUpdate(questionId, {
          answer: value,
          timestamp: now,
          timeSpent: updatedTimeSpent
        });
      }

      // Reset question timer
      setQuestionStartTime(now);

      // Auto-save after answering with debounce
      saveAnswers();

      // Auto-advance to next question if enabled
      const autoAdvance = localStorage.getItem('autoAdvance') === 'true';
      if (autoAdvance && questionType === QUESTION_TYPES.MULTIPLE_CHOICE) {
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            goToQuestion(currentQuestionIndex + 1);
          }
        }, 300);
      }

      return newAnswers;
    });
  }, [questionStartTime, saveAnswers, isConnected, currentQuestionIndex, questions.length, sendAnswerUpdate]);

  // Navigation
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      saveAnswers();
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      goToQuestion(currentQuestionIndex + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrevious = () => goToQuestion(currentQuestionIndex - 1);

  // Toggle flag for review
  const toggleFlagQuestion = useCallback((questionId) => {
    setFlaggedQuestions(prev => {
      const updated = { ...prev, [questionId]: !prev[questionId] };

      if (attemptId) {
        fetch(`${apiBaseUrl}/${attemptId}/flags`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flaggedQuestions: updated })
        }).catch(console.error);
      }

      return updated;
    });
  }, [attemptId, apiBaseUrl]);

  // Track time spent on each question
  useEffect(() => {
    if (!currentQuestion?.id) return;

    const questionId = currentQuestion.id;
    const startTime = Date.now();

    return () => {
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + timeElapsed
      }));
    };
  }, [currentQuestion?.id]);

  // Initialize test on component mount
  useEffect(() => {
    initializeTest();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
    };
  }, [initializeTest]);


  // Handle test submission with confirmation and WebSocket cleanup
  const handleSubmit = async () => {
    // Check for unanswered questions
    const unanswered = questions.filter(q => !answers[q.id]).length;

    if (unanswered > 0) {
      setShowSubmitConfirm(true);
    } else {
      await confirmSubmit();
    }
  };

  // Handle confirmed test submission with Redis cleanup
  const confirmSubmit = async () => {
    setShowSubmitConfirm(false);
    
    // Read from ref as fallback for stale closure safety
    const currentAttemptId = attemptId || attemptIdRef.current;
    console.log('Attempting to submit. attemptId:', currentAttemptId, '(state:', attemptId, ', ref:', attemptIdRef.current, ')');

    if (!currentAttemptId) {
      console.error('Submission failed: Missing attemptId');
      toast({
        title: 'Error',
        description: 'Test session invalid. Please refresh the page.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);

      // Cancel any pending auto-save to avoid race conditions
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Send final answers to server
      const response = await fetch(`${apiBaseUrl}/${currentAttemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          answers,
          timeSpent,
          flaggedQuestions,
          connectionStatus // Include connection status for analytics
        })
      });

      if (!response.ok) {
        console.error(`Submit failed with status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Submit response body:', text);

        let message = 'Submission failed';
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch (e) {
          // use text or default
        }
        throw new Error(message);
      }

      const results = await response.json();

      // Notify parent component — parent will handle navigation to results page
      if (onComplete) {
        // Pass both the raw results and the attemptId clearly
        onComplete({ ...(results.data || results), attemptId: results.data?.id || results.id || attemptId });
        return;
      }

      // Fallback redirect if no onComplete handler
      router.push(`/tests/${test?.id}/results/${results.data?.id || results.id || attemptId}`);

    } catch (error) {
      console.error('Test submission failed:', error);
      toast({
        title: 'Submission Error',
        description: error.message || 'Failed to submit test. Please try again.',
        variant: 'destructive',
      });

      // Attempt to save progress for recovery
      try {
        await saveAnswers();
        toast({
          title: 'Progress Saved',
          description: 'Your progress has been saved. You can continue where you left off.',
          variant: 'default',
        });
      } catch (saveError) {
        console.error('Failed to save progress:', saveError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle auto-submit when time runs out
  // Handle auto-submit when time runs out
  const handleAutoSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      toast({
        title: 'Time\'s up!',
        description: 'Your test has been automatically submitted.',
      });

      await confirmSubmit();

    } catch (error) {
      console.error('Auto-submit failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmSubmit]);

  // Check if an option is selected
  const isOptionSelected = (questionId, optionValue, questionType) => {
    if (!answers[questionId]) return false;

    if (questionType === QUESTION_TYPES.MULTIPLE_RESPONSE) {
      return answers[questionId].includes(optionValue);
    }

    return answers[questionId] === optionValue;
  };

  // Render test results and analytics
  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Completed!</CardTitle>
            <div className="text-muted-foreground">
              You've completed the test. Here's your performance analysis.
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <CardTitle className="text-3xl font-bold">
                    {testResults.score}%
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Correct</p>
                  <CardTitle className="text-3xl font-bold">
                    {testResults.correctAnswers} / {testResults.totalQuestions}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Time Spent</p>
                  <CardTitle className="text-3xl font-bold">
                    {formatTime(testResults.timeSpent)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Rank</p>
                  <CardTitle className="text-3xl font-bold">
                    #{testResults.rank || '--'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="study-plan">Study Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="mt-6">
                {testId && <TestAnalytics testId={testId} userId={session?.user?.id} />}
              </TabsContent>

              <TabsContent value="suggestions" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">AI-Powered Suggestions</h3>
                  {suggestions.length > 0 ? (
                    <ul className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-2 h-2 rounded-full ${suggestion.priority === 'high' ? 'bg-red-500' :
                              suggestion.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                          </div>
                          <p className="text-sm">{suggestion.text}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No suggestions available.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="study-plan" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personalized Study Plan</h3>
                  {studyPlan ? (
                    <div className="prose prose-sm max-w-none">
                      {studyPlan.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Generating study plan...</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Hide Analytics' : 'Show Detailed Analytics'}
            </Button>
            <Button onClick={() => router.push(test?.isPaid ? '/tests/premium' : '/dashboard')}>
              {test?.isPaid ? 'Back to Premium Tests' : 'Back to Dashboard'}
            </Button>
          </CardFooter>
        </Card>

        {showAnalytics && testId && (
          <div className="mt-6">
            <TestAnalytics testId={testId} userId={session?.user?.id} />
          </div>
        )}
      </div>
    );
  };

  // Render question based on type
  const renderQuestion = (question) => {
    const { id, type } = question;
    let { options } = question;

    // Parse options if string
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        console.error("Failed to parse options for question", id, e);
        options = [];
      }
    }

    // Ensure options is an array
    if (!Array.isArray(options)) {
      options = [];
    }

    // Normalize options to have value and label
    const formattedOptions = options.map((opt, idx) => {
      if (typeof opt === 'string') return { label: opt, value: opt };
      return {
        label: opt.label || opt.text || `Option ${idx + 1}`,
        value: opt.value || opt.id || opt.text || String(idx)
      };
    });

    const currentAnswer = answers[id] || '';

    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
      case QUESTION_TYPES.TRUE_FALSE:
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={(value) => handleAnswer(id, value, type)}
            className="space-y-3"
          >
            {formattedOptions.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={`${id}-${idx}`}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor={`${id}-${idx}`}
                  className="text-sm font-normal leading-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case QUESTION_TYPES.MULTIPLE_RESPONSE:
        return (
          <div className="space-y-3">
            {formattedOptions.map((option, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <Checkbox
                  id={`${id}-${idx}`}
                  checked={isOptionSelected(id, option.value, type)}
                  onCheckedChange={() => handleAnswer(id, option.value, type)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor={`${id}-${idx}`}
                  className="text-sm font-normal leading-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case QUESTION_TYPES.SHORT_ANSWER:
      case QUESTION_TYPES.ESSAY:
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswer(id, e.target.value, type)}
            placeholder={
              type === QUESTION_TYPES.SHORT_ANSWER
                ? 'Type your answer here...'
                : 'Type your detailed response here...'
            }
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  // Render question navigation
  const renderQuestionNavigation = () => (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={isFirstQuestion || isSubmitting}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNavigation(!showNavigation)}
          className="md:hidden"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant={flaggedQuestions[currentQuestion?.id] ? "default" : "outline"}
          size="icon"
          onClick={() => currentQuestion?.id && toggleFlagQuestion(currentQuestion.id)}
          disabled={!currentQuestion?.id || isSubmitting}
          title={flaggedQuestions[currentQuestion?.id] ? "Unflag for review" : "Flag for review"}
        >
          {flaggedQuestions[currentQuestion?.id] ? (
            <FlagOff className="h-4 w-4" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={saveAnswers}
          disabled={isSubmitting}
          title="Save answer"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleNext}
        disabled={isSubmitting}
        className="gap-2"
      >
        {isLastQuestion ? 'Review & Submit' : 'Next'}
        {isLastQuestion ? (
          <Send className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  // Render question overview
  const renderQuestionOverview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Question Navigator</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-primary"></span>
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-border"></span>
            Unanswered
          </span>
          <span className="flex items-center gap-1">
            <Flag className="h-3 w-3 text-yellow-500" fill="currentColor" />
            Flagged
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-96 overflow-y-auto p-1">
        {questions.map((q, index) => {
          const isCurrent = index === currentQuestionIndex;
          const isAnswered = answers[q.id] !== undefined &&
            (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : true);
          const isFlagged = flaggedQuestions[q.id];

          return (
            <Button
              key={q.id}
              variant={
                isCurrent ? "default" :
                  isFlagged ? "secondary" :
                    isAnswered ? "outline" : "ghost"
              }
              size="icon"
              className={cn(
                "relative h-10 w-10 rounded-full transition-all duration-200",
                isCurrent && "ring-2 ring-offset-2 ring-primary scale-105",
                isFlagged && "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
              )}
              onClick={() => {
                goToQuestion(index);
                setShowNavigation(false);
              }}
              disabled={isSubmitting}
              aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
              title={`Question ${index + 1}${isFlagged ? ' (Flagged)' : ''}`}
            >
              {index + 1}
              {isFlagged && (
                <span className="absolute -top-1 -right-1">
                  <Flag className="h-3 w-3 text-yellow-500" fill="currentColor" />
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );

  // Render submit confirmation dialog
  const renderSubmitConfirmation = () => (
    <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Test</DialogTitle>
          <DialogDescription>
            Are you sure you want to submit your test? You won't be able to make changes after submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Answered: {answeredQuestions} of {totalQuestions}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-yellow-500" />
              <span>Flagged: {flaggedCount} of {totalQuestions}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Time remaining: {formatTime(timeLeft)}</span>
            </div>
          </div>

          {answeredQuestions < totalQuestions && (
            <Alert variant="warning" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle>You have unanswered questions</AlertTitle>
                <AlertDescription>
                  {totalQuestions - answeredQuestions} questions have not been answered.
                  Are you sure you want to submit?
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowSubmitConfirm(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Test'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Initialize test on component mount
  useEffect(() => {
    initializeTest();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [initializeTest]);

  // Auto-save when answers change
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        saveAnswers();
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [answers, saveAnswers]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if in a textarea or input
      if (['TEXTAREA', 'INPUT'].includes(document.activeElement?.tagName)) {
        return;
      }

      // Next question (right arrow or n key)
      if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') && !isLastQuestion) {
        e.preventDefault();
        handleNext();
      }

      // Previous question (left arrow or p key)
      if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') && !isFirstQuestion) {
        e.preventDefault();
        handlePrevious();
      }

      // Toggle flag (f key)
      if (e.key.toLowerCase() === 'f' && currentQuestion?.id) {
        e.preventDefault();
        toggleFlagQuestion(currentQuestion.id);
      }

      // Number keys for question navigation (1-9)
      const numKey = parseInt(e.key);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        e.preventDefault();
        const questionIndex = numKey - 1; // Convert to 0-based index
        if (questionIndex < questions.length) {
          goToQuestion(questionIndex);
        }
      }

      // Submit test (Ctrl+Enter or Cmd+Enter)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setShowSubmitConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion?.id, isFirstQuestion, isLastQuestion, questions.length, toggleFlagQuestion]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p>Preparing your test...</p>
        </div>
      </div>
    );
  }

  // Show disqualified lockout UI if applicable
  if (isDisqualified || initialAttempt?.status === 'disqualified') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
        <div className="bg-destructive/10 p-6 rounded-full text-destructive animate-pulse">
          <AlertCircle className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-black text-destructive tracking-tight">Test Terminated</h2>
        <p className="text-muted-foreground max-w-md text-lg">
          This test session has been terminated due to security violations. Your answers up to this point have been saved.
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md">
          <p className="text-sm font-bold text-slate-500 mb-1">Reason for Lockout</p>
          <p className="text-lg font-black text-slate-850 dark:text-slate-100">
            {disqualificationReason || initialAttempt?.metadata?.disqualificationReason || 'Exceeded security limits.'}
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')} size="lg" className="rounded-2xl px-8 py-6 font-black text-lg">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Instruction gate — shown before the test starts (security briefing)
  if (!hasStarted && anyProctoringFeature && !isLoading && !isDisqualified && attemptStatus !== 'disqualified') {
    // Security rules list with icons for the briefing screen
    const securityRules = [
      {
        icon: <Maximize className="h-5 w-5 text-blue-400" />,
        bg: 'bg-blue-900/30 border-blue-700/40',
        title: 'Fullscreen Enforcement',
        desc: 'The test runs in fullscreen. Exiting triggers a security violation.',
        show: true,
      },
      {
        icon: <Eye className="h-5 w-5 text-purple-400" />,
        bg: 'bg-purple-900/30 border-purple-700/40',
        title: 'Activity Monitoring',
        desc: `Tab switching and app switching are logged. Allowed: ${test?.maxTabSwitches ?? 3} event(s) before action.`,
        show: test?.tabMonitoringEnabled ?? test?.proctoringEnabled ?? true,
      },
      {
        icon: <Eye className="h-5 w-5 text-green-400" />,
        bg: 'bg-green-900/30 border-green-700/40',
        title: 'Webcam Monitoring',
        desc: 'Your front camera is monitored to verify your presence.',
        show: test?.faceDetectionEnabled,
      },
      {
        icon: <Keyboard className="h-5 w-5 text-orange-400" />,
        bg: 'bg-orange-900/30 border-orange-700/40',
        title: 'Keyboard Restrictions',
        desc: 'Ctrl+C, Ctrl+V, F12, Print Screen and other shortcuts are blocked.',
        show: true,
      },
      {
        icon: <Copy className="h-5 w-5 text-red-400" />,
        bg: 'bg-red-900/30 border-red-700/40',
        title: 'Copy & Paste Disabled',
        desc: 'Copying, pasting, cutting, and right-clicking are not allowed.',
        show: true,
      },
    ].filter(r => r.show);

    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 mb-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Security Briefing</h1>
            <p className="text-muted-foreground mt-1">
              Please read and acknowledge all security rules before starting
            </p>
          </div>

          {/* Test info strip */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Duration</p>
              <p className="text-xl font-black mt-0.5">{test?.durationMinutes ?? 30} min</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Questions</p>
              <p className="text-xl font-black mt-0.5">{questions.length}</p>
            </div>
          </div>

          {/* Security rules */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Active Security Rules</p>
            {securityRules.map((rule, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${rule.bg}`}>
                <div className="flex-shrink-0 mt-0.5">{rule.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{rule.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Test-specific instructions */}
          {test?.instructions && (
            <div className="mb-6 p-4 bg-muted/40 rounded-xl border border-border">
              <p className="text-sm font-bold mb-1">Test Instructions</p>
              <p className="text-sm text-muted-foreground leading-relaxed italic">{test.instructions}</p>
            </div>
          )}

          {/* Acknowledgment checkbox */}
          <label
            htmlFor="ack-rules-checkbox"
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors mb-4',
              acknowledgedRules
                ? 'bg-green-950/40 border-green-700/50'
                : 'bg-muted/30 border-border hover:border-primary/40'
            )}
          >
            <input
              id="ack-rules-checkbox"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
              checked={acknowledgedRules}
              onChange={(e) => setAcknowledgedRules(e.target.checked)}
            />
            <span className="text-sm leading-relaxed">
              I have read and understand all security rules. I agree that my activity will be
              monitored and violations may result in disqualification.
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              id="start-test-btn"
              onClick={handleStartTestClick}
              disabled={!acknowledgedRules}
              size="lg"
              className={cn(
                'w-full py-6 rounded-2xl font-black text-lg shadow-xl transition-all duration-200',
                acknowledgedRules
                  ? 'shadow-primary/30 hover:scale-[1.01]'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              <Maximize className="mr-2 h-5 w-5" />
              Start Test &amp; Enter Fullscreen
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Cancel and Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if questions validly loaded but empty
  if (questions.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="bg-yellow-100 p-4 rounded-full">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold">Test is Empty</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This test has no questions yet. Please contact your administrator.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show error state if currentQuestion is missing but questions exist (shouldn't happen)
  if (!currentQuestion) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading test</AlertTitle>
        <AlertDescription>
          We couldn't load the current question. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6 select-none", hasStarted && isProctoringActive && "pt-10")} ref={mainContentRef}>
      {/* Security bar — fixed at top during active test */}
      <TestSecurityBar
        isFullscreen={isFullscreen}
        isTabMonitoring={test?.tabMonitoringEnabled ?? test?.proctoringEnabled ?? true}
        violationCount={warningCount}
        isProctoringActive={isProctoringActive}
        isVisible={hasStarted && !isSubmitting}
      />

      {/* Fullscreen-exit blocking overlay */}
      <TestSecurityOverlay
        isVisible={hasStarted && isProctoringActive && !isFullscreen && !isSubmitting}
        warningCount={warningCount}
      />

      {/* Header with test info and timer */}
      <Card className="relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />

        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">{test?.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span>•</span>
                <span>{answeredQuestions} answered</span>
                {timeLeft > 0 && (
                  <>
                    <span>•</span>
                    <span className={cn("flex items-center", timeWarning && "text-destructive font-medium")}>
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(timeLeft)}
                    </span>
                  </>
                )}
                {autoSaved && (
                  <span className="text-green-600 flex items-center ml-auto">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Auto-saved
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Proctoring Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border-4 border-amber-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Anti-Cheat Warning!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                You switched tabs or moved away from the test window. This event has been logged.
                Multiple violations may result in automatic disqualification.
              </p>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 w-full mb-8">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Warning Count</p>
                <p className="text-3xl font-black text-amber-600">{warningCount}</p>
              </div>

              <Button
                onClick={() => setShowWarningModal(false)}
                className="w-full py-6 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
              >
                I Understand, Continue Test
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Time warning */}
      {timeWarning && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Less than 5 minutes remaining!
          </AlertTitle>
        </Alert>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Question */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">
                      {currentQuestion.question}
                    </h3>
                    <Badge variant="outline" className="ml-2 whitespace-nowrap">
                      {QUESTION_TYPE_LABELS[currentQuestion.type]}
                    </Badge>
                  </div>

                  {/* Render question based on type */}
                  {renderQuestion(currentQuestion)}
                </div>
              </div>
            </CardContent>

            {/* Navigation */}
            <CardFooter className="border-t pt-4">
              {renderQuestionNavigation()}
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Questions Answered</span>
                    <span className="font-medium">{answeredQuestions}/{totalQuestions}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {test?.durationMinutes > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Time Remaining</span>
                      <span className={cn("font-medium", timeWarning && "text-destructive")}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <Progress
                      value={(timeLeft / (test.durationMinutes * 60)) * 100}
                      className="h-2"
                      indicatorClassName={timeWarning ? "bg-destructive" : "bg-primary"}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = answers[q.id] !== undefined &&
                    (Array.isArray(answers[q.id]) ?
                      answers[q.id].length > 0 :
                      answers[q.id] !== '');
                  const isFlagged = flaggedQuestions[q.id];

                  return (
                    <Button
                      key={q.id}
                      variant={
                        isCurrent ? "default" :
                          isFlagged ? "secondary" :
                            isAnswered ? "outline" : "ghost"
                      }
                      size="icon"
                      className={cn(
                        "relative h-10 w-10 rounded-full transition-all duration-200",
                        isCurrent && "ring-2 ring-offset-2 ring-primary scale-105",
                        isFlagged && "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
                      )}
                      onClick={() => {
                        goToQuestion(idx);
                        setShowNavigation(false);
                      }}
                      disabled={isSubmitting}
                      aria-label={`Question ${idx + 1}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
                      title={`Question ${idx + 1}${isFlagged ? ' (Flagged)' : ''}`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1">
                          <Flag className="h-3 w-3 text-yellow-500" fill="currentColor" />
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className="hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Next question</span>
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs">→</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Previous question</span>
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs">←</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Flag question</span>
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs">F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Jump to question</span>
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs">1-9</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Submit test</span>
                <kbd className="px-2 py-1 bg-muted rounded-md text-xs">Ctrl+Enter</kbd>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <Dialog open={showNavigation} onOpenChange={setShowNavigation}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Navigator</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderQuestionOverview()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      {renderSubmitConfirmation()}

      {/* ===== PROCTORING WARNING MODAL ===== */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-[480px] border-2 border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-xl">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Proctoring Violation Detected
            </DialogTitle>
            <DialogDescription className="text-base pt-1">
              You have left the test window. This activity has been recorded and reported.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning #{warningCount}</AlertTitle>
              <AlertDescription>
                Switching tabs, clicking outside the test window, or using other applications during the test is strictly prohibited.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Continued violations may result in automatic disqualification from this test.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowWarningModal(false)}
            >
              I Understand — Return to Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DISQUALIFICATION OVERLAY ===== */}
      {isDisqualified && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-destructive">Disqualified</h2>
              <p className="text-muted-foreground text-lg">
                You have been disqualified from this test due to proctoring violations.
              </p>
              {disqualificationReason && (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mt-2">
                  Reason: {disqualificationReason}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Your attempt has been recorded. Please contact your instructor if you believe this is an error.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => router.push('/tests')}
            >
              Return to Tests
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}