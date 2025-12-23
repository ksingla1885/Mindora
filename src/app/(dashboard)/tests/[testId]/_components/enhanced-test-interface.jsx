'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Check, Clock, Flag, Bookmark, ChevronLeft, ChevronRight, X, 
  AlertTriangle, Video, Maximize2, Minimize2, RefreshCw, AlertCircle, Eye, EyeOff, Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTestProctoring } from '@/hooks/useTestProctoring';
import { randomizeTest, formatTime, calculateScore } from '@/lib/test-utils';
import { cn } from '@/lib/utils';

// Proctoring status indicator component
const ProctoringStatus = ({ proctoringState }) => {
  if (!proctoringState.isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-lg">
            <div className={cn(
              'w-3 h-3 rounded-full',
              proctoringState.faceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
            )} />
            <span className="text-sm font-medium">
              {proctoringState.faceDetected ? 'Camera Active' : 'Face Not Detected'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Proctoring is active. Please keep your face visible.</p>
        </TooltipContent>
      </Tooltip>
      
      {proctoringState.violationCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {proctoringState.violationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {proctoringState.violationCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="space-y-2">
              <p className="font-semibold">Proctoring Alerts ({proctoringState.violationCount})</p>
              {proctoringState.lastWarning && (
                <p className="text-sm">{proctoringState.lastWarning.message}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

// Question navigation panel
const QuestionNavigation = ({
  questions,
  currentIndex,
  onQuestionSelect,
  answers,
  bookmarkedQuestions,
  flaggedQuestions,
  onToggleBookmark,
  onToggleFlag,
  isReviewMode,
}) => {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg">Questions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
            const isBookmarked = bookmarkedQuestions.has(q.id);
            const isFlagged = flaggedQuestions.has(q.id);
            const isCurrent = currentIndex === index;
            
            return (
              <div key={q.id} className="relative">
                <Button
                  variant={isCurrent ? 'default' : isAnswered ? 'outline' : 'ghost'}
                  size="sm"
                  className={`w-full h-10 p-0 relative ${
                    isBookmarked ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => onQuestionSelect(index)}
                >
                  {index + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1">
                      <Flag className="h-3 w-3 text-red-500 fill-current" />
                    </span>
                  )}
                </Button>
                
                {/* Quick actions */}
                <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(q.id);
                    }}
                    className="text-xs p-0.5 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                  >
                    <Bookmark
                      className={`h-3 w-3 ${
                        isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFlag(q.id);
                    }}
                    className="text-xs p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                    aria-label={isFlagged ? 'Unflag question' : 'Flag question'}
                  >
                    <Flag
                      className={`h-3 w-3 ${
                        isFlagged ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col items-start gap-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full border"></div>
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-muted"></div>
          <span>Answered</span>
        </div>
        {isReviewMode && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Correct</span>
          </div>
        )}
        {isReviewMode && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Incorrect</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// Enhanced test interface component
export default function EnhancedTestInterface({ testData, onTestSubmit }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for test data and progress
  const [randomizedQuestions, setRandomizedQuestions] = useState(() => {
    // Randomize questions on initial load
    return randomizeTest(testData.questions, {
      shuffleQuestions: true,
      shuffleOptions: true,
      maxQuestions: testData.maxQuestions || testData.questions.length
    });
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(testData.duration * 60); // in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showViolations, setShowViolations] = useState(false);
  
  // Proctoring
  const {
    violations,
    isFullscreen,
    faceDetected,
    tabFocusLost,
    videoRef,
    startProctoring,
    stopProctoring,
    toggleFullscreen,
    logViolation,
    isProctoringSupported,
  } = useProctoring(testData.id);
  
  // Shuffle questions if needed
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  
  // Initialize test
  useEffect(() => {
    // Shuffle questions (except in review mode)
    if (!isReviewMode) {
      const shuffled = [...testData.questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledQuestions(shuffled);
    } else {
      setShuffledQuestions(testData.questions);
    }
    
    // Start proctoring if supported
    if (isProctoringSupported) {
      startProctoring();
    }
    
    // Request fullscreen
    const requestFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    };
    
    requestFullscreen();
    
    // Cleanup
    return () => {
      stopProctoring();
    };
  }, [testData.id, isReviewMode, isProctoringSupported, startProctoring, stopProctoring]);
  
  // Timer effect
  useEffect(() => {
    if (isSubmitted || !testData.isTimed) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isSubmitted, testData.isTimed]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Navigation
  const goToQuestion = (index) => {
    if (index >= 0 && index < shuffledQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Bookmark and flag questions
  const toggleBookmark = (questionId) => {
    setBookmarkedQuestions(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(questionId)) {
        newBookmarks.delete(questionId);
      } else {
        newBookmarks.add(questionId);
      }
      return newBookmarks;
    });  
  };
  
  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newFlags = new Set(prev);
      if (newFlags.has(questionId)) {
        newFlags.delete(questionId);
      } else {
        newFlags.add(questionId);
        logViolation('QUESTION_FLAGGED', `Question ${questionId} was flagged for review`);
      }
      return newFlags;
    });
  };
  
  // Submit test
  const handleSubmitTest = async () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);
    
    try {
      // In a real app, submit answers to the server
      console.log('Submitting test with answers:', answers);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      stopProctoring();
      
      // Call the parent's onTestSubmit if provided
      if (onTestSubmit) {
        onTestSubmit(answers);
      }
      
      toast({
        title: 'Test submitted successfully!',
        description: 'Your answers have been recorded.',
      });
      
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAutoSubmit = () => {
    if (!isSubmitted) {
      toast({
        title: 'Time\'s up!',
        description: 'Your test has been auto-submitted.',
      });
      handleSubmitTest();
    }
  };
  
  // Render question based on type
  const renderQuestion = (question) => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.question}</p>
            {question.imageUrl && (
              <div className="my-4">
                <img 
                  src={question.imageUrl} 
                  alt="Question illustration" 
                  className="max-w-full h-auto rounded-md border"
                />
              </div>
            )}
            <RadioGroup
              value={answers[question.id] || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-2"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={index.toString()} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      case 'descriptive':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.question}</p>
            {question.imageUrl && (
              <div className="my-4">
                <img 
                  src={question.imageUrl} 
                  alt="Question illustration" 
                  className="max-w-full h-auto rounded-md border"
                />
              </div>
            )}
            <Textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[200px]"
            />
            {question.wordLimit && (
              <p className="text-sm text-muted-foreground text-right">
                {answers[question.id]?.length || 0} / {question.wordLimit} words
              </p>
            )}
          </div>
        );
        
      default:
        return <p>Unsupported question type</p>;
    }
  };
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
  
  // Get current question
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
  
  // If test is submitted, show results
  if (isSubmitted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Check className="h-6 w-6 text-green-600" />
              Test Submitted Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p>Thank you for completing the test. Your responses have been recorded.</p>
              <p>You'll be notified when your results are available.</p>
              
              {testData.showScore && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Your Score</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background rounded">
                      <div className="text-3xl font-bold">
                        {Object.keys(answers).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Questions Attempted
                      </div>
                    </div>
                    <div className="text-center p-4 bg-background rounded">
                      <div className="text-3xl font-bold">
                        {shuffledQuestions.length - Object.keys(answers).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Questions Skipped
                      </div>
                    </div>
                    <div className="text-center p-4 bg-background rounded">
                      <div className="text-3xl font-bold">
                        {Math.round((Object.keys(answers).length / shuffledQuestions.length) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completion
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {testData.allowReview && !isReviewMode && (
                <div className="mt-6">
                  <Button onClick={() => setIsReviewMode(true)}>
                    Review Your Answers
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end p-6 border-t">
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Test Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{testData.title}</h1>
              <p className="text-sm text-muted-foreground">
                {testData.subject} • {testData.topic}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {testData.isTimed && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-md">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="font-mono font-medium">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              
              <Button
                variant={isFullscreen ? 'default' : 'outline'}
                size="sm"
                onClick={toggleFullscreen}
                className="gap-2"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden md:inline">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden md:inline">Fullscreen</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViolations(true)}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden md:inline">Proctoring</span>
                {violations.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {violations.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </div>
          </div>
          
          {testData.isTimed && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Question Navigation */}
            <div className="lg:col-span-1">
              <QuestionNavigation
                questions={shuffledQuestions}
                currentIndex={currentQuestionIndex}
                onQuestionSelect={goToQuestion}
                answers={answers}
                bookmarkedQuestions={bookmarkedQuestions}
                flaggedQuestions={flaggedQuestions}
                onToggleBookmark={toggleBookmark}
                onToggleFlag={toggleFlag}
                isReviewMode={isReviewMode}
              />
            </div>
            
            {/* Question Area */}
            <div className="lg:col-span-3 h-full flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Question {currentQuestionIndex + 1}
                        {bookmarkedQuestions.has(currentQuestion?.id) && (
                          <Bookmark className="h-4 w-4 text-yellow-500 fill-current inline-block ml-2" />
                        )}
                        {flaggedQuestions.has(currentQuestion?.id) && (
                          <Flag className="h-4 w-4 text-red-500 fill-current inline-block ml-1" />
                        )}
                      </CardTitle>
                      {currentQuestion?.marks && (
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBookmark(currentQuestion?.id)}
                        className={bookmarkedQuestions.has(currentQuestion?.id) ? 'text-yellow-500' : ''}
                        aria-label={bookmarkedQuestions.has(currentQuestion?.id) ? 'Remove bookmark' : 'Bookmark question'}
                      >
                        <Bookmark
                          className={`h-5 w-5 ${
                            bookmarkedQuestions.has(currentQuestion?.id) ? 'fill-current' : ''
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFlag(currentQuestion?.id)}
                        className={flaggedQuestions.has(currentQuestion?.id) ? 'text-red-500' : ''}
                        aria-label={flaggedQuestions.has(currentQuestion?.id) ? 'Unflag question' : 'Flag question'}
                      >
                        <Flag
                          className={`h-5 w-5 ${
                            flaggedQuestions.has(currentQuestion?.id) ? 'fill-current' : ''
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-6 overflow-y-auto">
                  {currentQuestion ? (
                    renderQuestion(currentQuestion)
                  ) : (
                    <p>Loading question...</p>
                  )}
                </CardContent>
                
                <CardFooter className="border-t p-4 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={goToPrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const nextUnanswered = shuffledQuestions.findIndex(
                          (q, idx) => idx > currentQuestionIndex && !answers[q.id]
                        );
                        if (nextUnanswered !== -1) {
                          goToQuestion(nextUnanswered);
                        } else {
                          goToNextQuestion();
                        }
                      }}
                    >
                      Skip
                    </Button>
                    
                    {isLastQuestion ? (
                      <Button onClick={() => setShowSubmitDialog(true)}>
                        Submit Test
                      </Button>
                    ) : (
                      <Button onClick={goToNextQuestion}>
                        Next <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Proctoring Camera (hidden by default) */}
      {isProctoringSupported && (
        <div className="fixed bottom-4 right-4 w-40 h-30 bg-black rounded-md overflow-hidden border-2 border-red-500 shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!faceDetected && (
            <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold">FACE NOT DETECTED</span>
            </div>
          )}
        </div>
      )}
      
      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your test? You won't be able to make any changes after submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Questions Attempted:</span>
              <span className="font-medium">
                {Object.keys(answers).length} / {shuffledQuestions.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Time Remaining:</span>
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
            
            {shuffledQuestions.length - Object.keys(answers).length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You have {shuffledQuestions.length - Object.keys(answers).length} unanswered questions.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTest} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Proctoring Violations Dialog */}
      <Dialog open={showViolations} onOpenChange={setShowViolations}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proctoring Alerts</DialogTitle>
            <DialogDescription>
              The following proctoring violations have been detected during your test.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {violations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No proctoring violations detected.
              </div>
            ) : (
              <div className="space-y-2">
                {violations.map((violation, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <AlertTitle className="capitalize">
                        {violation.type.replace(/_/g, ' ').toLowerCase()}
                      </AlertTitle>
                      <AlertDescription>
                        {violation.message} • {new Date(violation.timestamp).toLocaleTimeString()}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Proctoring Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Camera</span>
                  <Badge variant={faceDetected ? 'default' : 'destructive'}>
                    {faceDetected ? 'Active' : 'Not Detected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fullscreen</span>
                  <Badge variant={isFullscreen ? 'default' : 'destructive'}>
                    {isFullscreen ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tab Focus</span>
                  <Badge variant={!tabFocusLost ? 'default' : 'destructive'}>
                    {!tabFocusLost ? 'Focused' : 'Lost Focus'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowViolations(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
