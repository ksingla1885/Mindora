'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Flag, Clock, CheckCircle, XCircle, AlertTriangle, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable item component for ordering questions
function SortableItem({ id, children, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-background rounded-md border">
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export function TestPlayer({ test, initialAnswers = {}, onSubmit, onTimeUp, readOnly = false, showAnswers = false }) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [matchingAnswers, setMatchingAnswers] = useState({});
  const [orderingAnswers, setOrderingAnswers] = useState({});
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Initialize matching and ordering answers
  useEffect(() => {
    const initialMatching = {};
    const initialOrdering = {};
    
    test.questions.forEach((q, qIndex) => {
      if (q.type === 'MATCHING' && q.matchingPairs) {
        initialMatching[qIndex] = q.matchingPairs.map(pair => ({
          ...pair,
          selectedRight: ''
        }));
      } else if (q.type === 'ORDERING' && q.orderedItems) {
        initialOrdering[qIndex] = [...q.orderedItems];
      }
    });
    
    setMatchingAnswers(initialMatching);
    setOrderingAnswers(initialOrdering);
  }, [test.questions]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialAnswers,
  });

  // Timer effect
  useEffect(() => {
    if (readOnly) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = Math.max(0, test.durationMinutes * 60 - elapsedSeconds);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0 && onTimeUp) {
        clearInterval(timerRef.current);
        onTimeUp();
      }
    };

    // Initial calculation
    calculateTimeLeft();
    
    // Set up interval
    timerRef.current = setInterval(calculateTimeLeft, 1000);
    
    // Save start time if not already set
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    return () => clearInterval(timerRef.current);
  }, [test.durationMinutes, onTimeUp, readOnly]);

  // Auto-save progress
  useEffect(() => {
    if (readOnly) return;
    
    const autoSave = () => {
      // Implement auto-save logic here
      console.log('Auto-saving progress...');
    };
    
    const interval = setInterval(autoSave, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [readOnly]);

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  
  // Handle matching answer selection
  const handleMatchingSelect = (qIndex, pairIndex, value) => {
    setMatchingAnswers(prev => ({
      ...prev,
      [qIndex]: prev[qIndex].map((pair, idx) => 
        idx === pairIndex ? { ...pair, selectedRight: value } : pair
      )
    }));
  };
  
  // Handle ordering items drag and drop
  const handleDragEnd = (event, qIndex) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setOrderingAnswers(prev => ({
        ...prev,
        [qIndex]: (() => {
          const oldIndex = prev[qIndex].findIndex(item => item.id === active.id);
          const newIndex = prev[qIndex].findIndex(item => item.id === over.id);
          return arrayMove(prev[qIndex], oldIndex, newIndex);
        })()
      }));
    }
  };
  
  // Check if ordering answer is correct
  const isOrderingCorrect = (qIndex) => {
    if (!orderingAnswers[qIndex]) return false;
    
    return orderingAnswers[qIndex].every((item, index) => 
      item.correctPosition === index + 1
    );
  };
  
  // Check if matching answer is correct
  const isMatchingCorrect = (qIndex, pairIndex) => {
    if (!matchingAnswers[qIndex] || !matchingAnswers[qIndex][pairIndex]) return false;
    
    const pair = matchingAnswers[qIndex][pairIndex];
    const question = test.questions[qIndex];
    const correctPair = question.matchingPairs.find(p => p.left === pair.left);
    
    return correctPair && correctPair.right === pair.selectedRight;
  };
  
  // Calculate score for the current question
  const calculateQuestionScore = (qIndex) => {
    const question = test.questions[qIndex];
    
    switch (question.type) {
      case 'MCQ':
        const selectedOption = watch(`question_${qIndex}`);
        return selectedOption === question.correctAnswer ? 1 : 0;
        
      case 'MATCHING':
        if (!matchingAnswers[qIndex]) return 0;
        return matchingAnswers[qIndex].filter((pair, idx) => 
          isMatchingCorrect(qIndex, idx)
        ).length / (question.matchingPairs?.length || 1);
        
      case 'ORDERING':
        return isOrderingCorrect(qIndex) ? 1 : 0;
        
      case 'DESCRIPTIVE':
        // For descriptive questions, we can't auto-grade
        return 0;
        
      default:
        return 0;
    }
  };

  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isQuestionFlagged = flaggedQuestions.has(currentQuestionIndex);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Scroll to top of question
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Scroll to top of question
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFlagQuestion = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (isQuestionFlagged) {
      newFlagged.delete(currentQuestionIndex);
    } else {
      newFlagged.add(currentQuestionIndex);
    }
    setFlaggedQuestions(newFlagged);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitTest = async (data) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Include matching and ordering answers in the submission
      const submissionData = {
        ...data,
        matchingAnswers,
        orderingAnswers,
        timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000)
      };
      
      await onSubmit(submissionData);
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

  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const timePercentage = (timeLeft / (test.durationMinutes * 60)) * 100;

  // Get answer status for review mode
  const getAnswerStatus = (questionIndex) => {
    if (!readOnly) return null;
    const question = test.questions[questionIndex];
    const answer = initialAnswers[`question_${question.id}`];
    
    if (!answer) return 'unanswered';
    if (question.correctAnswer === answer) return 'correct';
    return 'incorrect';
  };

  return (
    <div className="space-y-6">
      {/* Test Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {test.questions.length}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {!readOnly && (
            <Button
              variant={isQuestionFlagged ? 'default' : 'outline'}
              size="sm"
              onClick={toggleFlagQuestion}
              className="gap-1.5"
            >
              <Flag className="h-4 w-4" />
              <span>{isQuestionFlagged ? 'Flagged' : 'Flag'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Timer Warning */}
      {!readOnly && timePercentage < 20 && timePercentage > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Time Running Out!</p>
            <p className="text-sm text-yellow-700">
              {timePercentage < 10 ? 'Less than 10% time remaining!' : 'Less than 20% time remaining!'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">
                  Question {currentQuestionIndex + 1}
                  {isQuestionFlagged && (
                    <Badge variant="outline" className="ml-2">
                      <Flag className="h-3 w-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">
                    {currentQuestion.difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>
              </div>
              
              {readOnly && (
                <div className="flex items-center space-x-1">
                  {getAnswerStatus(currentQuestionIndex) === 'correct' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {getAnswerStatus(currentQuestionIndex) === 'incorrect' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose max-w-none mb-6">
              <p>{currentQuestion.text}</p>
              
              {currentQuestion.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt="Question diagram" 
                    className="max-w-full h-auto rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Answer Input */}
            {currentQuestion.type === 'MCQ' ? (
              <div className="space-y-3">
                <RadioGroup 
                  value={watch(`question_${currentQuestion.id}`) || ''}
                  onValueChange={(value) => setValue(`question_${currentQuestion.id}`, value)}
                  disabled={readOnly}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${currentQuestion.id}-${index}`}
                      />
                      <Label 
                        htmlFor={`option-${currentQuestion.id}-${index}`}
                        className="font-normal cursor-pointer"
                      >
                        {option}
                      </Label>
                      
                      {readOnly && option === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      )}
                      {readOnly && 
                        watch(`question_${currentQuestion.id}`) === option && 
                        option !== currentQuestion.correctAnswer && (
                          <XCircle className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                {...register(`question_${currentQuestion.id}`)}
                readOnly={readOnly}
                className="min-h-[120px]"
              />
            )}
            
            {/* Explanation (shown in review mode) */}
            {readOnly && currentQuestion.explanation && (
              <div className="mt-6 p-4 bg-muted/20 rounded-md">
                <h4 className="font-medium mb-2">Explanation:</h4>
                <p className="text-sm">{currentQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6 border-t">
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={isFirstQuestion || isSubmitting}
              >
                Previous
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleNextQuestion}
                disabled={isLastQuestion || isSubmitting}
              >
                Next
              </Button>
            </div>
            
            {!readOnly && (
              <div className="space-x-2">
                {!showConfirmSubmit ? (
                  <Button
                    type="button"
                    variant={isLastQuestion ? 'default' : 'outline'}
                    onClick={() => isLastQuestion ? setShowConfirmSubmit(true) : handleNextQuestion()}
                    disabled={isSubmitting}
                  >
                    {isLastQuestion ? 'Submit Test' : 'Save & Next'}
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConfirmSubmit(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Confirm Submit'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </form>
      
      {/* Question Navigation Grid */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-medium">Question Navigation</h3>
          <p className="text-sm text-muted-foreground">
            Click on a question to jump to it
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {test.questions.map((_, index) => {
              const isAnswered = !!watch(`question_${test.questions[index].id}`);
              const isCurrent = index === currentQuestionIndex;
              const isFlagged = flaggedQuestions.has(index);
              const answerStatus = readOnly ? getAnswerStatus(index) : null;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    'relative h-10 w-10 rounded-md flex items-center justify-center border transition-colors',
                    isCurrent 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : isAnswered 
                        ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' 
                        : 'bg-muted/50 hover:bg-muted',
                    readOnly && answerStatus === 'correct' && 'bg-green-50 border-green-200',
                    readOnly && answerStatus === 'incorrect' && 'bg-red-50 border-red-200',
                    readOnly && answerStatus === 'unanswered' && 'bg-yellow-50 border-yellow-200',
                  )}
                >
                  {index + 1}
                  
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1">
                      <Flag className="h-3 w-3 text-yellow-500" fill="currentColor" />
                    </span>
                  )}
                  
                  {readOnly && answerStatus === 'correct' && (
                    <CheckCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
                  )}
                  
                  {readOnly && answerStatus === 'incorrect' && (
                    <XCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>
          
          {readOnly && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-100 border border-green-300 mr-1.5" />
                <span>Correct</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-100 border border-red-300 mr-1.5" />
                <span>Incorrect</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-yellow-100 border border-yellow-300 mr-1.5" />
                <span>Unanswered</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
