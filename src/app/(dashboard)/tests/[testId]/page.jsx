'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, Lock, Clock, FileText, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentButton from '@/components/PaymentButton';
import { TestTaker } from '@/components/tests/TestTaker';
import { cn } from '@/lib/cn';

export default function TestPage() {
  const params = useParams();
  const testId = params.testId;
  const { data: session, status } = useSession();
  const router = useRouter();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tests/${testId}`, { cache: 'no-store' });

        if (!response.ok) {
          if (response.status === 401) {
            router.push(`/auth/signin?callbackUrl=/tests/${testId}`);
            return;
          }
          throw new Error('Failed to load test');
        }

        const data = await response.json();
        if (data.success) {
          setTest(data.data);
          setIsPurchased(data.data.isPurchased);
        } else {
          throw new Error(data.error || 'Failed to load test');
        }
      } catch (err) {
        console.error('Error fetching test:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchTest();
    } else if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/tests/${testId}`);
    }
  }, [testId, status, router]);

  const handleStartTest = () => {
    setHasStarted(true);
  };

  const handleTestComplete = (results) => {
    console.log('Test completed:', results);
    // Refresh router to update server data/cache
    router.refresh();
    // Redirect to the main tests page (Weekly Olympiad Tests)
    router.push('/tests');
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!test) return null;

  // Check if payment is needed
  // If test is paid AND price > 0 AND not purchased
  const needsPayment = test.isPaid && test.price > 0 && !isPurchased;

  // Check if test is completed based on server status or attempt analysis
  // Logic: if not allowMultipleAttempts and status is COMPLETED
  const userStatus = test.userStatus || 'NOT_STARTED';
  // Fallback to local check if userStatus not yet available
  const userAttempts = test.attempts || [];

  const hasInProgress = userAttempts.some(a => a.status?.toLowerCase() === 'in_progress');
  const hasAnyAttempt = userAttempts.length > 0;

  // Lock if: Single attempt allowed AND has attempts AND no active attempt to resume
  const isCompleted = !test.allowMultipleAttempts && hasAnyAttempt && !hasInProgress;

  // If test is running, render TestTaker
  if (hasStarted && !needsPayment) {
    // Map questions from test.testQuestions to the format expected by TestTaker
    // TestTaker expects an array of question objects
    const questions = test.testQuestions?.map(tq => {
      let type = tq.question.type;
      if (type === 'mcq') type = 'MULTIPLE_CHOICE';
      else if (type === 'short_answer') type = 'SHORT_ANSWER';
      else if (type === 'long_answer') type = 'ESSAY';

      return {
        ...tq.question,
        type,
        question: tq.question.text || tq.question.question
      };
    }) || [];

    // Ensure durationMinutes is set
    const processedTest = {
      ...test,
      durationMinutes: test.duration || test.durationMinutes || 60
    };

    return (
      <div className="min-h-screen bg-background">
        <TestTaker
          test={processedTest}
          questions={questions}
          onComplete={handleTestComplete}
        />
      </div>
    );
  }

  // Render Test Details / Landing Page
  return (
    <div className="container mx-auto p-6 max-w-3xl py-12">
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{test.title}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {test.description || 'No description available.'}
              </CardDescription>
            </div>
            {needsPayment && (
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Lock className="w-4 h-4 mr-1" />
                Premium
              </div>
            )}
            {!needsPayment && (
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium flex items-center",
                isCompleted
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              )}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {isCompleted ? 'Completed' : (test.price > 0 ? 'Purchased' : 'Free')}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
              <Clock className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-semibold">{test.duration || test.durationMinutes || 60} mins</span>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
              <FileText className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Questions</span>
              <span className="font-semibold">{test.testQuestions?.length || 0}</span>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Total Marks</span>
              <span className="font-semibold">
                {test.testQuestions?.reduce((acc, tq) => acc + (tq.question.marks || 1), 0) || 0}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Instructions</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Ensure you have a stable internet connection.</li>
              <li>Do not refresh the page during the test.</li>
              <li>The test will auto-submit when the timer ends.</li>
              <li>You can flag questions to review them later.</li>
            </ul>
          </div>

          {needsPayment && (
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex items-center justify-between mt-6">
              <div>
                <p className="font-medium text-lg">Unlock this test</p>
                <p className="text-muted-foreground">Get full access to questions and detailed analysis.</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">₹{test.price}</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end pt-6 border-t">
          {needsPayment ? (
            <PaymentButton
              testId={test.id}
              price={test.price}
              buttonText="Unlock Now"
            />
          ) : (

            <Button
              size="lg"
              onClick={handleStartTest}
              className={
                cn(
                  "w-full md:w-auto px-8 text-lg",
                  isCompleted && "bg-green-600 hover:bg-green-700 cursor-default"
                )}
              disabled={isCompleted}
            >
              {isCompleted ? 'Test Completed' : 'Start Test'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div >
  );
}
