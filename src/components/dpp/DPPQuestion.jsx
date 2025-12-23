'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  FiCheck, 
  FiX, 
  FiClock, 
  FiChevronRight, 
  FiChevronLeft, 
  FiLoader, 
  FiBookOpen,
  FiAward,
  FiHelpCircle,
  FiZap,
  FiSkipForward,
  FiChevronDown,
  FiVolume2,
  FiVolumeX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import TextToSpeech from '@/components/TextToSpeech';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

const questionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

const getOptionClasses = (option, selectedOption, showAnswer, isCorrect, correctAnswer) => {
  let classes = 'w-full text-left p-4 rounded-md border transition-colors duration-200 flex items-center';
  
  if (showAnswer) {
    if (option === correctAnswer) {
      classes += ' bg-green-50 border-green-300 text-green-800';
    } else if (option === selectedOption && !isCorrect) {
      classes += ' bg-red-50 border-red-300 text-red-800';
    } else {
      classes += ' border-gray-200';
    }
  } else {
    classes += selectedOption === option 
      ? ' border-blue-500 bg-blue-50 text-blue-700' 
      : ' border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700';
  }
  
  return classes;
};

function DPPQuestion({
  question,
  onAnswer = () => {},
  onSkip = () => {},
  onNext = () => {},
  onPrev = () => {},
  isSubmitting = false,
  showAnswer = false,
  isCorrect = null,
  questionNumber = 1,
  totalQuestions = 1,
  className = '',
  error = null,
  ...props
}) {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const questionRef = useRef(null);
  
  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Set up keyboard navigation
  useKeyboardNavigation({
    onNext: showAnswer ? onNext : null,
    onPrevious: showAnswer ? null : onPrev,
    onSubmit: !showAnswer ? handleSubmit : null,
    onSkip: !showAnswer ? handleSkip : null,
    canGoNext: showAnswer && questionNumber < totalQuestions,
    canGoPrevious: !showAnswer && questionNumber > 1,
    canSubmit: !showAnswer && (question.type === 'MCQ' ? !!selectedOption : !!textAnswer.trim()),
    canSkip: !showAnswer,
    activeElementId: `option-${question.id}`
  });

  // Focus management when component mounts or question changes
  useEffect(() => {
    // Focus on the first option when the question loads
    if (question.type === 'MCQ' && question.options?.length > 0) {
      const firstOption = document.getElementById(`option-${question.id}-0`);
      if (firstOption) {
        firstOption.focus();
      }
    } else if (questionRef.current) {
      // For non-MCQ questions, focus on the textarea
      const textarea = questionRef.current.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }

    // Reset time spent when question changes
    setTimeSpent(0);
  }, [question.id, question.type, question.options]);

  // Timer effect
  useEffect(() => {
    if (showAnswer) return;

    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showAnswer]);

  // Reset state when question changes
  useEffect(() => {
    if (question) {
      setSelectedOption(null);
      setTextAnswer('');
      setTimeSpent(0);
      setIsExplanationOpen(false);
    }
  }, [question]);

  const handleOptionSelect = useCallback((option) => {
    if (showAnswer) return;
    setSelectedOption(option);
    
    // Focus management for keyboard navigation
    const optionIndex = question.options.indexOf(option);
    if (optionIndex !== -1) {
      const optionElement = document.getElementById(`option-${question.id}-${optionIndex}`);
      if (optionElement) {
        optionElement.focus();
      }
    }
  }, [showAnswer, question.options, question.id]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (isSubmitting) return;
    
    const answer = question?.type === 'MCQ' ? selectedOption : textAnswer;
    if ((question?.type === 'MCQ' && !selectedOption) || 
        (question?.type === 'DESCRIPTIVE' && !textAnswer.trim())) {
      toast({
        title: "Answer required",
        description: "Please select an answer or type your response",
        variant: "destructive",
      });
      return;
    }
    
    onAnswer?.(answer, timeSpent);
  }, [question, selectedOption, textAnswer, timeSpent, onAnswer, isSubmitting, toast]);

  const handleSkip = useCallback(() => {
    if (isSubmitting) return;
    onSkip?.();
  }, [onSkip, isSubmitting]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isOptionCorrect = (option) => {
    if (!showAnswer || question.type !== 'MCQ') return false;
    return option === question.correctAnswer;
  };

  const isOptionIncorrect = (option) => {
    if (!showAnswer || question.type !== 'MCQ' || isCorrect) return false;
    return option === selectedOption && option !== question.correctAnswer;
  };

  const getOptionClasses = (option) => {
    let classes = 'w-full text-left p-4 border rounded-lg transition-colors duration-200';
    
    if (showAnswer) {
      if (isOptionCorrect(option)) {
        classes += ' bg-green-50 border-green-300 text-green-800';
      } else if (isOptionIncorrect(option)) {
        classes += ' bg-red-50 border-red-300 text-red-800';
      } else {
        classes += ' border-gray-200 text-gray-700';
      }
    } else {
      classes += selectedOption === option 
        ? ' border-blue-500 bg-blue-50 text-blue-700' 
        : ' border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700';
    }
    
    return classes;
  };

  // Loading state
  if (!question) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="flex justify-between mt-8">
          <Skeleton className="h-10 w-24" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className={`w-full ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        key={question.id}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        {...props}
      >
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b bg-muted/10">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-sm font-medium text-muted-foreground">
                  <FiBookOpen className="h-4 w-4" />
                  <span>Question {questionNumber} of {totalQuestions}</span>
                </div>
                
                {/* Text-to-Speech Toggle */}
                <div className="ml-2">
                  <TextToSpeech text={question.text} />
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`${difficultyColors[question.difficulty] || 'bg-gray-100 text-gray-800'} border-0`}
                      >
                        {question.difficulty}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Difficulty: {question.difficulty}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FiClock className="mr-1 h-4 w-4" />
                        <span>{formatTime(timeSpent)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Time spent on this question</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center space-x-2">
                {question.points > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <FiAward className="h-3.5 w-3.5 text-amber-500" />
                          <span>{question.points} XP</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Points for correct answer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {question.streak && question.streak > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <FiZap className="h-3.5 w-3.5 text-blue-500" />
                          <span>{question.streak} day streak</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current streak for this topic</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <div className="flex items-center space-x-2">
                  <span>Mastery</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <FiHelpCircle className="h-3 w-3 text-muted-foreground/70" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Your current mastery level for this topic. Keep practicing to improve!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span>{Math.round(question.mastery * 100)}%</span>
              </div>
              <Progress value={question.mastery * 100} className="h-2" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="prose max-w-none mb-6">
              <p className="text-gray-900 text-lg">{question.text}</p>
              
              {question.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={question.imageUrl} 
                    alt="Question diagram" 
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Answer Input */}
            {question.type === 'MCQ' ? (
              <div className="space-y-3 mb-6">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    id={`option-${question.id}-${index}`}
                    type="button"
                    className={getOptionClasses(option)}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showAnswer}
                    role="radio"
                    aria-checked={selectedOption === option}
                    aria-labelledby={`option-${question.id}-${index}-label`}
                    tabIndex={showAnswer ? -1 : 0}
                    onKeyDown={(e) => {
                      // Handle space and enter keys for selection
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleOptionSelect(option);
                      }
                      // Arrow key navigation between options
                      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const nextOption = document.getElementById(`option-${question.id}-${index + 1}`);
                        if (nextOption) nextOption.focus();
                      }
                      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const prevOption = document.getElementById(`option-${question.id}-${index - 1}`);
                        if (prevOption) prevOption.focus();
                      }
                    }}
                  >
                    <span id={`option-${question.id}-${index}-label`} className="sr-only">
                      Option {String.fromCharCode(65 + index)}
                    </span>
                    <div className="flex items-center">
                      {showAnswer && isOptionCorrect(option) && (
                        <FiCheck className="h-5 w-5 mr-2 text-green-500" />
                      )}
                      {showAnswer && isOptionIncorrect(option) && (
                        <FiX className="h-5 w-5 mr-2 text-red-500" />
                      )}
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  id="answer"
                  rows={4}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                  placeholder="Type your answer here..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  readOnly={showAnswer}
                  aria-label="Type your answer here"
                  onKeyDown={(e) => {
                    // Submit on Ctrl+Enter or Cmd+Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && textAnswer.trim()) {
                      handleSubmit();
                    }
                  }}
                />
              </div>
            )}

            {/* Explanation (shown after submission) */}
            {showAnswer && question.explanation && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                >
                  {isExplanationOpen ? 'Hide' : 'Show'} Explanation
                  {isExplanationOpen ? (
                    <FiChevronRight className="ml-1 h-4 w-4 transform rotate-90" />
                  ) : (
                    <FiChevronLeft className="ml-1 h-4 w-4 transform -rotate-90" />
                  )}
                </button>
                
                {isExplanationOpen && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
                    {question.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            {showAnswer && (
              <div className={`mt-4 p-4 rounded-md ${
                isCorrect 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {isCorrect ? (
                    <FiCheck className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <FiX className="h-5 w-5 mr-2 text-red-500" />
                  )}
                  <span className="font-medium">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {!isCorrect && question.correctAnswer && (
                  <div className="mt-2 text-sm">
                    Correct answer: <span className="font-medium">{question.correctAnswer}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t bg-muted/5 px-6 py-4">
            <motion.div 
              className="flex justify-between w-full items-center"
              variants={itemVariants}
            >
              <motion.div
                whileHover={!showAnswer && !isSubmitting ? { x: -2 } : {}}
                whileTap={!showAnswer && !isSubmitting ? { scale: 0.98 } : {}}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  disabled={showAnswer || isSubmitting}
                  className="gap-1.5 transition-all"
                  aria-label="Skip this question"
                  data-skip-button
                >
                  <FiSkipForward className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Skip
                  </span>
                </Button>
              </motion.div>
              
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={questionNumber > 1 && !isSubmitting ? { x: -2 } : {}}
                  whileTap={questionNumber > 1 && !isSubmitting ? { scale: 0.95 } : {}}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onPrev}
                    disabled={questionNumber <= 1 || isSubmitting}
                    className="rounded-full transition-all"
                    aria-label="Previous question"
                    data-prev-button
                  >
                    <FiChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous question</span>
                  </Button>
                </motion.div>
                
                <AnimatePresence mode="wait">
                  {!showAnswer ? (
                    <motion.div
                      key="submit"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || (question.type === 'MCQ' ? !selectedOption : !textAnswer.trim())}
                        className="gap-1.5 transition-all"
                        whileHover={!isSubmitting && (question.type === 'MCQ' ? selectedOption : textAnswer.trim()) ? { 
                          scale: 1.02,
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                        } : {}}
                        whileTap={!isSubmitting && (question.type === 'MCQ' ? selectedOption : textAnswer.trim()) ? { 
                          scale: 0.98 
                        } : {}}
                        data-submit-button
                        aria-label="Submit answer"
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="h-4 w-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <FiCheck className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                              Submit Answer
                            </span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="next"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Button
                        id="next-button"
                        type="button"
                        onClick={onNext}
                        disabled={isSubmitting}
                        className="gap-1.5 transition-all"
                        whileHover={!isSubmitting ? { 
                          scale: 1.02,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                        } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                        data-next-button
                        aria-label={questionNumber >= totalQuestions ? 'Finish practice' : 'Next question'}
                      >
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                          {questionNumber >= totalQuestions ? 'Finish Practice' : 'Next Question'}
                        </span>
                        <FiChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Progress indicator */}
            <div className="mt-4 w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{questionNumber} of {totalQuestions}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: `${(questionNumber / totalQuestions) * 100}%`,
                    transition: { duration: 0.5, ease: 'easeOut' }
                  }}
                />
              </div>
            </div>
          </CardFooter>
        ) : (
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reload
            </button>
          </div>
        )
        </Card>
        
        {/* Confetti effect for correct answer */}
        <AnimatePresence>
          {showAnswer && isCorrect && isMounted && (
            <motion.div 
              className="fixed inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    scale: Math.random() * 0.5 + 0.5,
                  }}
                  animate={{
                    y: [0, -100],
                    x: [0, (Math.random() - 0.5) * 100],
                    opacity: [1, 0],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{
                    duration: Math.random() * 2 + 1,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'linear',
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DPPQuestion, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.question?.id === nextProps.question?.id &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.showAnswer === nextProps.showAnswer &&
    prevProps.isCorrect === nextProps.isCorrect
  );
});
