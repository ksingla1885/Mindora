'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTestWebSocket } from '@/hooks/useTestWebSocket';
import { useTestAssistant } from '@/lib/ai/testAssistant';
import { TestAnalytics } from '@/components/analytics/TestAnalytics';
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
  ChevronRight, List, X, Check, CheckSquare, Square
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

  // State for analytics and AI features
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [personalizedTips, setPersonalizedTips] = useState([]);
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // State management
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(test?.durationMinutes * 60 || 1800);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState(initialQuestions);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

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
    if (!test?.id) {
      setIsLoading(false);
      return;
    }

    try {
      let attemptData = initialAttempt;

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
          throw new Error(errorData.message || 'Failed to start test attempt');
        }

        const response = await attemptRes.json();
        attemptData = response.attempt;
      }

      setAttemptId(attemptData.id);

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
      setFlaggedQuestions(attemptData.flaggedQuestions || {});
      setTimeSpent(attemptData.timeSpent || {});

      // Load questions if not provided
      if (questions.length === 0) {
        // If questions are part of the test object, use them
        if (test.questions && test.questions.length > 0) {
          setQuestions(test.questions);
        } else {
          const questionsRes = await fetch(`/api/tests/${test.id}/questions`);
          if (!questionsRes.ok) throw new Error('Failed to load questions');
          const questionsData = await questionsRes.json();
          setQuestions(questionsData);
        }
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
    }
  }, [test, session, questions.length, initialAttempt, apiBaseUrl]);

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

    // Set auto-saved state for UI feedback
    setAutoSaved(false);

    // Debounce the save to avoid too many requests
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/${attemptId}/answers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers,
            timeLeft,
            timeSpent,
            currentQuestionIndex,
            flaggedQuestions
          })
        });

        if (!response.ok) throw new Error('Save failed');

        setAutoSaved(true);
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(() => setAutoSaved(false), 3000);

      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, [attemptId, answers, timeLeft, timeSpent, currentQuestionIndex, apiBaseUrl]);

    // Handle test completion with analytics
    const handleTestCompletion = useCallback(async (results) => {
      try {
        setIsSubmitting(true);
        setTestResults(results);

        // Analyze performance using AI
        const analysis = await analyzePerformance(results);
        if (analysis) {
          setPerformanceAnalysis(analysis);

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

      if (isSubmitting) return;

      try {
        setIsSubmitting(true);

        // Final save before submission
        await saveAnswers();

        // Send final answers to server
        const response = await fetch(`${apiBaseUrl}/${attemptId}/submit`, {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Submission failed');
        }

        const results = await response.json();

        // Clean up Redis session
        try {
          await fetch(`${apiBaseUrl}/${attemptId}/cleanup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (cleanupError) {
          console.error('Cleanup failed, but continuing...', cleanupError);
        }

        // Update UI state
        setTestResults(results);
        setShowTestResults(true);

        // Scroll to results
        if (mainContentRef.current) {
          mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        // Calculate performance metrics in the background
        const calculatePerformance = async () => {
          try {
            if (analyzePerformance) {
              const analysis = await analyzePerformance(answers, questions);
              setPerformanceAnalysis(analysis);

              // Generate study plan based on performance
              if (generateStudyPlan) {
                const plan = await generateStudyPlan(analysis.weakAreas);
                setStudyPlan(plan);
              }

              // Get personalized tips
              if (getPersonalizedTips) {
                const tips = await getPersonalizedTips(analysis);
                setPersonalizedTips(tips);
              }
            }
          } catch (error) {
            console.error('Error calculating performance:', error);
          }
        };

        // Don't await this to avoid blocking UI
        calculatePerformance();

        // Notify parent component if provided
        if (onComplete) {
          onComplete(results);
        }

        // Track test completion
        if (window.gtag) {
          window.gtag('event', 'test_completed', {
            test_id: test?.id,
            test_name: test?.title,
            score: results.score,
            correct_answers: results.correctAnswers,
            total_questions: results.totalQuestions,
            time_spent: Math.round((test?.durationMinutes * 60 - timeLeft) / 60) // in minutes
          });
        }

        // Show success message
        toast({
          title: 'Test Submitted!',
          description: 'Your test has been successfully submitted.',
          variant: 'default',
        });

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
    const handleAutoSubmit = useCallback(() => {
      toast({
        title: 'Time\'s up!',
        description: 'Your test has been automatically submitted.',
      });
      confirmSubmit();
    }, [answers, timeSpent, attemptId]);
    try {
      await handleSubmit();

      toast({
        title: 'Test Auto-Submitted',
        description: 'Your test has been automatically submitted as the time has run out.',
      });
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
  }, [handleSubmit, isSubmitting]);

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
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
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
    const { id, type, options } = question;
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
            {options?.map((option, idx) => (
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
            {options?.map((option, idx) => (
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
            onClick={handleSubmit}
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

  // Show error state if no questions
  if (!currentQuestion) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading test</AlertTitle>
        <AlertDescription>
          We couldn't load the test questions. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" ref={mainContentRef}>
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
    </div>
  );
}