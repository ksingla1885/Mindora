'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, HelpCircle, Award, Zap, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export function DPPPractice({ dppId, onComplete, onSkip }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [dpp, setDpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Mock data - replace with actual API call
  const mockDPP = {
    id: dppId,
    title: 'Daily Practice Problems - Calculus',
    subject: 'Mathematics',
    topic: 'Differentiation',
    difficulty: 'Medium',
    totalQuestions: 5,
    timeLimit: 30, // minutes
    questions: [
      {
        id: 'q1',
        type: 'MCQ',
        question: 'What is the derivative of f(x) = 3x² + 2x - 5?',
        options: [
          { id: 'a', text: '6x + 2' },
          { id: 'b', text: '3x + 2' },
          { id: 'c', text: '6x - 5' },
          { id: 'd', text: '3x² + 2' }
        ],
        correctAnswer: 'a',
        explanation: 'The derivative of 3x² is 6x, the derivative of 2x is 2, and the derivative of a constant (-5) is 0.',
        hint: 'Remember the power rule: d/dx(xⁿ) = n*x^(n-1)'
      },
      {
        id: 'q2',
        type: 'SHORT_ANSWER',
        question: 'Find the derivative of f(x) = sin(x) + cos(x)',
        correctAnswer: 'cos(x) - sin(x)',
        explanation: 'The derivative of sin(x) is cos(x) and the derivative of cos(x) is -sin(x).',
        hint: 'Use the basic trigonometric derivatives: d/dx(sin x) = cos x, d/dx(cos x) = -sin x'
      },
      // Add more questions...
    ],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    progress: 0
  };

  // Fetch DPP data
  useEffect(() => {
    const fetchDPP = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this from your API
        // const response = await fetch(`/api/dpp/${dppId}`);
        // const data = await response.json();
        // setDpp(data);
        
        // Using mock data for now
        setTimeout(() => {
          setDpp(mockDPP);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching DPP:', err);
        setError('Failed to load practice problems');
        setLoading(false);
      }
    };

    if (dppId) {
      fetchDPP();
    }
  }, [dppId]);

  // Timer effect
  useEffect(() => {
    if (!dpp || dpp.completed) return;
    
    const timer = setInterval(() => {
      setTimeSpent(prev => {
        // Check if time limit is reached
        if (prev >= dpp.timeLimit * 60) {
          handleTimeUp();
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [dpp]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!dpp || isSubmitting) return;
    
    setIsSubmitting(true);
    const currentQuestion = dpp.questions[currentQuestionIndex];
    
    // Check if answer is correct
    const correct = currentQuestion.type === 'MCQ' 
      ? userAnswer === currentQuestion.correctAnswer
      : userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    
    setIsCorrect(correct);
    setShowSolution(true);
    
    // In a real app, you would submit the answer to your API
    // await submitAnswer(dpp.id, currentQuestion.id, userAnswer, timeSpent, hintUsed);
    
    // Show feedback
    toast({
      title: correct ? 'Correct! 🎉' : 'Not quite right',
      description: correct 
        ? 'Great job! You got it right.'
        : `The correct answer is: ${currentQuestion.correctAnswer}`,
      variant: correct ? 'default' : 'destructive'
    });
    
    // Move to next question or complete DPP
    setTimeout(() => {
      if (currentQuestionIndex < dpp.questions.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer('');
        setShowSolution(false);
        setIsCorrect(null);
        setHintUsed(false);
        setShowHint(false);
      } else {
        // Complete DPP
        handleComplete();
      }
      
      setIsSubmitting(false);
    }, 1500);
  }, [dpp, currentQuestionIndex, userAnswer, timeSpent, hintUsed, isSubmitting]);

  // Handle DPP completion
  const handleComplete = useCallback(() => {
    if (!dpp) return;
    
    // In a real app, you would mark DPP as completed in your API
    // await completeDPP(dpp.id);
    
    // Update local state
    setDpp(prev => ({
      ...prev,
      completed: true,
      completedAt: new Date().toISOString(),
      progress: 100
    }));
    
    // Show completion message
    toast({
      title: 'Practice Completed!',
      description: `You've completed ${dpp.title}`,
      action: (
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      )
    });
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete({
        dppId: dpp.id,
        score: calculateScore(),
        timeSpent,
        questions: dpp.questions.length,
        correctAnswers: dpp.questions.filter((q, idx) => 
          idx < currentQuestionIndex ? true : isCorrect
        ).length
      });
    }
  }, [dpp, timeSpent, onComplete, currentQuestionIndex, isCorrect]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    toast({
      title: 'Time\'s up!',
      description: 'The time limit for this practice session has been reached.',
      variant: 'destructive'
    });
    
    // Auto-submit the DPP
    handleComplete();
  }, [handleComplete]);

  // Calculate score
  const calculateScore = useCallback(() => {
    if (!dpp) return 0;
    
    const correctAnswers = dpp.questions.filter((q, idx) => 
      idx < currentQuestionIndex ? true : isCorrect
    ).length;
    
    return Math.round((correctAnswers / dpp.questions.length) * 100);
  }, [dpp, currentQuestionIndex, isCorrect]);

  // Handle skip question
  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip(dpp.questions[currentQuestionIndex].id);
    }
    
    // Move to next question or complete
    if (currentQuestionIndex < dpp.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowSolution(false);
      setIsCorrect(null);
      setHintUsed(false);
      setShowHint(false);
    } else {
      handleComplete();
    }
  }, [currentQuestionIndex, dpp, onSkip, handleComplete]);

  // Handle show hint
  const handleShowHint = useCallback(() => {
    setShowHint(true);
    setHintUsed(true);
    
    // In a real app, you would track hint usage in your API
    // await trackHintUsage(dpp.id, dpp.questions[currentQuestionIndex].id);
  }, [dpp, currentQuestionIndex]);

  // Render loading state
  if (loading || !dpp) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const currentQuestion = dpp.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + (isCorrect !== null ? 1 : 0)) / dpp.questions.length) * 100;
  const timeRemaining = Math.max(0, (dpp.timeLimit * 60) - timeSpent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{dpp.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{dpp.subject} • {dpp.topic}</span>
            <Badge variant={dpp.difficulty.toLowerCase()}>
              {dpp.difficulty}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>Time: {formatTime(timeRemaining)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Question {currentQuestionIndex + 1} of {dpp.questions.length}</span>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Question card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            {currentQuestion.difficulty && (
              <Badge variant="outline" className="ml-2">
                {currentQuestion.difficulty}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg">{currentQuestion.question}</p>
          </div>
          
          {/* Answer input */}
          {currentQuestion.type === 'MCQ' ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option.id}
                  variant={userAnswer === option.id ? 'default' : 'outline'}
                  className={`w-full justify-start text-left h-auto py-3 ${
                    showSolution && option.id === currentQuestion.correctAnswer 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800' 
                      : ''
                  }`}
                  onClick={() => !showSolution && setUserAnswer(option.id)}
                  disabled={showSolution}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full border mr-3 ${
                      userAnswer === option.id 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background'
                    }`}>
                      {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                    </div>
                    <span>{option.text}</span>
                    {showSolution && option.id === currentQuestion.correctAnswer && (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={showSolution}
                className="min-h-[100px]"
              />
              
              {showSolution && isCorrect !== null && (
                <div className={`p-4 rounded-md ${
                  isCorrect 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center font-medium mb-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Correct!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        Not quite right
                      </>
                    )}
                  </div>
                  <p className="text-sm">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Hint */}
          {currentQuestion.hint && !showHint && !showSolution && (
            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm text-muted-foreground"
                onClick={handleShowHint}
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Need a hint?
              </Button>
            </div>
          )}
          
          {showHint && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{currentQuestion.hint}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Actions */}
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="space-x-2">
            {currentQuestionIndex > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentQuestionIndex(prev => prev - 1);
                  setUserAnswer('');
                  setShowSolution(false);
                  setIsCorrect(null);
                  setShowHint(false);
                }}
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
          </div>
          
          <div className="space-x-2">
            {!showSolution ? (
              <Button 
                onClick={handleSubmit}
                disabled={!userAnswer.trim() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                {!isSubmitting && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            ) : currentQuestionIndex < dpp.questions.length - 1 ? (
              <Button 
                onClick={() => {
                  setCurrentQuestionIndex(prev => prev + 1);
                  setUserAnswer('');
                  setShowSolution(false);
                  setIsCorrect(null);
                  setShowHint(false);
                }}
              >
                Next Question
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Complete Practice
                <Award className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Progress and stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentQuestionIndex + 1} <span className="text-sm font-normal text-muted-foreground">/ {dpp.questions.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateScore()}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DPPPractice;
