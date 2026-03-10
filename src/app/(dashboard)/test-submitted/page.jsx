'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Award, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import JSConfetti from 'js-confetti';

function TestSubmittedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const testId = searchParams.get('testId');
    const attemptId = searchParams.get('attemptId');

    useEffect(() => {
        const jsConfetti = new JSConfetti();
        jsConfetti.addConfetti({
            emojis: ['🎉', '✨', '🎓', '✅', '⭐'],
            confettiNumber: 120,
        });
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-2 border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95">
                    <CardHeader className="text-center pb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: 'spring',
                                stiffness: 260,
                                damping: 20,
                                delay: 0.2,
                            }}
                            className="mx-auto mb-4 bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-24 h-24 flex items-center justify-center"
                        >
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Test Submitted!
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="text-center space-y-4 pt-4">
                        <p className="text-muted-foreground text-lg">
                            Your test has been successfully submitted and your answers have been recorded.
                        </p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="p-4 bg-muted/50 rounded-lg border border-border/50"
                        >
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                <span>Results and detailed analytics are now available</span>
                            </div>
                        </motion.div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
                        {/* Primary action: Go back to Tests listing */}
                        <Button
                            className="w-full h-11 text-base"
                            onClick={() => router.push('/tests')}
                            id="back-to-tests-btn"
                        >
                            <BookOpen className="mr-2 w-4 h-4" />
                            Back to Tests
                        </Button>

                        {/* Secondary: View detailed results (only if attemptId is available) */}
                        {testId && attemptId && (
                            <Button
                                variant="outline"
                                className="w-full h-11 text-base group"
                                onClick={() => router.push(`/tests/${testId}/results/${attemptId}`)}
                                id="view-results-btn"
                            >
                                View Detailed Results
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        )}

                        {/* Tertiary: Go to Dashboard */}
                        <Button
                            variant="ghost"
                            className="w-full h-10 text-sm text-muted-foreground"
                            onClick={() => router.push('/dashboard')}
                            id="go-to-dashboard-btn"
                        >
                            <Home className="mr-2 w-3.5 h-3.5" />
                            Go to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}

export default function TestSubmittedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <TestSubmittedContent />
        </Suspense>
    );
}
