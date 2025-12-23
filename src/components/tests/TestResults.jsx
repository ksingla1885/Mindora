'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle, Award, BarChart2, Clock, FileText, Home, Download, BarChart3, ListChecks, Users, TrendingUp, Award as Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Helper component for the analytics card
function StatCard({ title, value, icon: Icon, description, className }) {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for the progress bar with label
function ProgressWithLabel({ value, label, className }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className={className} />
    </div>
  );
}

export function TestResults({ test, userAnswers, timeSpent, onRetake, matchingAnswers = {}, orderingAnswers = {} }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Calculate results with support for different question types
  const { score, correctAnswers, totalQuestions, questionReview, performanceByType, performanceByDifficulty, timeAnalysis } = useMemo(() => {
    let correctCount = 0;
    const questionStats = [];
    const typeStats = {};
    const difficultyStats = {};
    let totalTimeSpent = 0;
    
    test.questions.forEach((q, index) => {
      let isCorrect = false;
      let userAnswer = userAnswers[`question_${index}`];
      
      // Handle different question types
      switch (q.type) {
        case 'MATCHING':
          const matchingAnswer = matchingAnswers[index] || [];
          isCorrect = matchingAnswer.every((pair, idx) => {
            const correctPair = q.matchingPairs.find(p => p.left === pair.left);
            return correctPair && correctPair.right === pair.selectedRight;
          });
          userAnswer = matchingAnswer.map(p => `${p.left} → ${p.selectedRight || '?'}`).join('; ');
          break;
          
        case 'ORDERING':
          const orderingAnswer = orderingAnswers[index] || [];
          isCorrect = orderingAnswer.every((item, idx) => 
            item.correctPosition === idx + 1
          );
          userAnswer = orderingAnswer.map((item, idx) => `${idx + 1}. ${item.text}`).join(' | ');
          break;
          
        default: // MCQ and DESCRIPTIVE
          isCorrect = userAnswer === q.correctAnswer;
      }
      
      if (isCorrect) correctCount++;
      
      // Track performance by question type
      if (!typeStats[q.type]) {
        typeStats[q.type] = { total: 0, correct: 0 };
      }
      typeStats[q.type].total++;
      if (isCorrect) typeStats[q.type].correct++;
      
      // Track performance by difficulty
      const difficulty = q.difficulty || 'medium';
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { total: 0, correct: 0 };
      }
      difficultyStats[difficulty].total++;
      if (isCorrect) difficultyStats[difficulty].correct++;
      
      // Track time spent per question (if available)
      const qTime = q.timeSpent || 0;
      totalTimeSpent += qTime;
      
      questionStats.push({
        ...q,
        questionNumber: index + 1,
        isCorrect,
        userAnswer,
        timeSpent: qTime,
        isFlagged: q.isFlagged
      });
    });
    
    // Calculate overall score
    const totalQ = test.questions.length;
    const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const passed = score >= (test.passingScore || 70);
    
    // Calculate time analysis
    const avgTimePerQuestion = totalTimeSpent / totalQ;
    const timeVariance = timeSpent - (test.durationMinutes * 60);
    const timeStatus = timeVariance <= 0 ? 'under' : 'over';
    const timeDifference = Math.abs(timeVariance);
    const timePerQuestion = totalQ > 0 ? Math.round(timeSpent / totalQ) : 0;
    
    return {
      score,
      correctAnswers: correctCount,
      totalQuestions: totalQ,
      passed,
      questionReview: questionStats,
      performanceByType: typeStats,
      performanceByDifficulty: difficultyStats,
      timeAnalysis: {
        totalTimeSpent,
        timePerQuestion,
        timeStatus,
        timeDifference,
        avgTimePerQuestion
      }
    };
  }, [test, userAnswers, matchingAnswers, orderingAnswers]);
  
  const passed = score >= (test.passingScore || 70);
  const timeStatus = timeAnalysis.timeStatus;
  const timeDifference = timeAnalysis.timeDifference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Test Results</h1>
          <p className="text-muted-foreground">{test.title}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push('/tests')}>
            <Home className="h-4 w-4 mr-2" />
            Back to Tests
          </Button>
          {onRetake && (
            <Button onClick={onRetake}>
              Retake Test
            </Button>
          )}
        </div>
      </div>

      {/* Result Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 opacity-20" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Your Score</h3>
              <Award className={cn(
                'h-6 w-6',
                passed ? 'text-yellow-500 fill-yellow-500/20' : 'text-gray-400'
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative">
                <Progress 
                  value={score} 
                  className="h-32 w-32 [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out [&>div]:delay-150"
                  style={{
                    '--progress-primary': passed ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)',
                    '--progress-background': passed ? 'hsl(142.1 76.2% 96.3%)' : 'hsl(0 72.2% 95.6%)',
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{score}%</span>
                  <span className="text-xs text-muted-foreground">
                    {correctAnswers}/{totalQuestions} correct
                  </span>
                </div>
              </div>
              <Badge 
                variant={passed ? 'success' : 'destructive'}
                className="mt-2"
              >
                {passed ? 'Passed' : 'Failed'}
              </Badge>
              <p className="text-sm text-muted-foreground text-center">
                {passed 
                  ? `You passed! You needed ${test.passingScore}% to pass.`
                  : `You needed ${test.passingScore}% to pass. Keep practicing!`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time Spent */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Time Spent</h3>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                </p>
                <p className="text-sm text-muted-foreground">
                  {timeStatus === 'saved' 
                    ? `${timeDifference} minutes under average`
                    : `${timeDifference} minutes over average`
                  }
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. time per question:</span>
                  <span>{Math.floor(timePerQuestion / 60)}m {timePerQuestion % 60}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total test time:</span>
                  <span>{test.durationMinutes} minutes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance by Difficulty */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Performance</h3>
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(performanceByDifficulty).map(([difficulty, { total, correct }]) => {
              const percentage = Math.round((correct / total) * 100) || 0;
              const color = {
                easy: 'bg-green-500',
                medium: 'bg-yellow-500',
                hard: 'bg-red-500',
              }[difficulty];
              
              return (
                <div key={difficulty} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{difficulty}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn('h-full rounded-full', color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {correct} of {total} questions correct
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex -mb-px space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'summary'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            )}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'review'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            )}
          >
            Review Answers
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'summary' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-lg font-medium flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Strengths
                </h3>
              </CardHeader>
              <CardContent>
                {correctAnswers > 0 ? (
                  <ul className="space-y-2">
                    {Object.entries(performanceByDifficulty)
                      .filter(([_, { correct }]) => correct > 0)
                      .map(([difficulty, { correct, total }]) => (
                        <li key={difficulty} className="flex items-center">
                          <span className="font-medium capitalize w-20">{difficulty}:</span>
                          <div className="flex-1 ml-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{correct} of {total} correct</span>
                              <span>{Math.round((correct / total) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500"
                                style={{ width: `${(correct / total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No strengths identified. Keep practicing!</p>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-lg font-medium flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  Areas for Improvement
                </h3>
              </CardHeader>
              <CardContent>
                {correctAnswers < totalQuestions ? (
                  <ul className="space-y-2">
                    {Object.entries(performanceByDifficulty)
                      .filter(([_, { correct, total }]) => correct < total)
                      .map(([difficulty, { correct, total }]) => {
                        const incorrect = total - correct;
                        return (
                          <li key={difficulty} className="flex items-center">
                            <span className="font-medium capitalize w-20">{difficulty}:</span>
                            <div className="flex-1 ml-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{incorrect} of {total} incorrect</span>
                                <span>{Math.round((incorrect / total) * 100)}%</span>
                              </div>
                              <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500"
                                  style={{ width: `${(incorrect / total) * 100}%` }}
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Great job! You answered all questions correctly.</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-medium">Recommendations</h3>
                </CardHeader>
                <CardContent>
                  {!passed ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Based on your performance, here are some recommendations to improve your score:
                      </p>
                      <ul className="space-y-2 list-disc pl-5">
                        {Object.entries(performanceByDifficulty)
                          .filter(([_, { correct, total }]) => correct < total * 0.7) // Less than 70% correct
                          .map(([difficulty]) => (
                            <li key={difficulty} className="text-muted-foreground">
                              Focus on practicing more <span className="font-medium capitalize">{difficulty}</span> level questions.
                            </li>
                          ))}
                        <li className="text-muted-foreground">
                          Review the explanations for incorrect answers to understand your mistakes.
                        </li>
                        <li className="text-muted-foreground">
                          Take more practice tests to improve your time management.
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Great job on passing the test! Here are some suggestions to continue improving:
                      </p>
                      <ul className="space-y-2 list-disc pl-5">
                        <li className="text-muted-foreground">
                          Review any incorrect answers to understand your mistakes.
                        </li>
                        <li className="text-muted-foreground">
                          Challenge yourself with more difficult questions or time constraints.
                        </li>
                        <li className="text-muted-foreground">
                          Share your achievement and help others in the community.
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Question Review</h3>
              <p className="text-sm text-muted-foreground">
                Review your answers and see the correct solutions.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionReview.map((question, index) => (
                <div 
                  key={question.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    question.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">Question {question.questionNumber}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {question.difficulty}
                        </Badge>
                        <Badge 
                          variant={question.isCorrect ? 'success' : 'destructive'}
                          className="gap-1"
                        >
                          {question.isCorrect ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {question.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>
                  
                  <div className="prose max-w-none mb-4">
                    <p>{question.text}</p>
                  </div>
                  
                  {question.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={question.imageUrl} 
                        alt="Question diagram" 
                        className="max-w-full h-auto rounded-md border"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {question.type === 'MCQ' ? (
                      <div className="space-y-2">
                        {question.options.map((option, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              'p-3 rounded-md border',
                              option === question.correctAnswer 
                                ? 'bg-green-50 border-green-200' 
                                : option === question.userAnswer && !question.isCorrect
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white border-gray-200'
                            )}
                          >
                            <div className="flex items-center">
                              <div 
                                className={cn(
                                  'h-5 w-5 rounded-full border flex items-center justify-center mr-3 flex-shrink-0',
                                  option === question.correctAnswer 
                                    ? 'bg-green-100 border-green-300 text-green-600'
                                    : option === question.userAnswer && !question.isCorrect
                                      ? 'bg-red-100 border-red-300 text-red-600'
                                      : 'bg-gray-50 border-gray-300'
                                )}
                              >
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span>{option}</span>
                              {option === question.correctAnswer && (
                                <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                              )}
                              {option === question.userAnswer && !question.isCorrect && (
                                <XCircle className="h-4 w-4 ml-2 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</p>
                          <div className="p-3 bg-muted/20 rounded-md">
                            {question.userAnswer || 'No answer provided'}
                          </div>
                        </div>
                        {!question.isCorrect && question.correctAnswer && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Correct Answer:</p>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                              {question.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-700">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={() => window.print()}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Print Results
        </Button>
        
        <div className="space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/tests')}
          >
            Back to Tests
          </Button>
          {onRetake && (
            <Button onClick={onRetake}>
              Retake Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
