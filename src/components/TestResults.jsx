'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Award, ArrowLeft, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

export default function TestResults({ results, test }) {
  const router = useRouter();
  
  if (!results) return null;

  const accuracy = Math.round((results.correctAnswers / results.totalQuestions) * 100) || 0;
  const timePerQuestion = Math.round(results.timeSpent / results.totalQuestions) || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Test Completed!</CardTitle>
              </div>
              <p className="text-gray-600 mt-1 text-sm">
                {test?.title || 'Test'} • {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white px-4 py-3 rounded-lg shadow-sm border">
              <div className="text-3xl font-bold text-blue-600 text-center">
                {results.percentage}%
              </div>
              <div className="text-xs text-gray-500 text-center">
                {results.score} / {results.maxScore} points
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Correct Answers</p>
                  <p className="text-lg font-semibold">
                    {results.correctAnswers} <span className="text-sm font-normal text-gray-500">/ {results.totalQuestions}</span>
                  </p>
                </div>
              </div>
              <Progress value={accuracy} className="h-2 mt-3 bg-gray-100" indicatorClassName="bg-green-500" />
              <p className="text-xs text-gray-500 mt-1">{accuracy}% accuracy</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-lg font-semibold">
                    {results.score} <span className="text-sm font-normal text-gray-500">/ {results.maxScore} points</span>
                  </p>
                </div>
              </div>
              <Progress value={results.percentage} className="h-2 mt-3 bg-gray-100" indicatorClassName="bg-blue-500" />
              <p className="text-xs text-gray-500 mt-1">{results.percentage}% of max score</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Spent</p>
                  <p className="text-lg font-semibold">
                    {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-600">Avg. time per question: {timePerQuestion}s</p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Question-wise Analysis
              </h3>
            </div>
            <div className="divide-y">
              {results.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 ${result.isCorrect ? 'bg-white' : 'bg-red-50'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Q{index + 1}.</span>
                        <span>{result.questionText}</span>
                      </div>
                      
                      {!result.isCorrect && (
                        <div className="mt-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-red-600 font-medium">Your answer:</span>
                            <span>{result.userAnswer || 'Not answered'}</span>
                          </div>
                          <div className="flex items-start gap-2 mt-1">
                            <span className="text-green-600 font-medium">Correct answer:</span>
                            <span>{result.correctAnswer}</span>
                          </div>
                        </div>
                      )}
                      
                      {result.explanation && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                          <p className="font-medium text-gray-700 mb-1">Explanation:</p>
                          <p className="text-gray-600">{result.explanation}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Marks:</span>
                      <span className="font-medium">
                        {result.marks} / {result.maxMarks}
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <button 
                        onClick={() => {
                          // Implement review logic
                          const questionElement = document.getElementById(`question-${result.questionId}`);
                          if (questionElement) {
                            questionElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review Question
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 px-6 py-4 border-t flex flex-col sm:flex-row justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => router.push(`/tests/${test?.id}/review`)}
              className="flex-1 sm:flex-none"
            >
              Review Test
            </Button>
            
            <Button 
              onClick={() => router.push(`/tests`)}
              className="flex-1 sm:flex-none"
            >
              Take Another Test
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Additional Recommendations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full mt-0.5">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Review Weak Areas</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Focus on topics where you scored lower to improve your performance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Take Practice Tests</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Regular practice will help you improve your speed and accuracy.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
