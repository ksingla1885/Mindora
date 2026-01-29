import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Award,
    BarChart2,
    ChevronLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

export default async function TestResultPage({ params }) {
    const session = await auth();
    if (!session) redirect('/auth/signin');

    const { testId, attemptId } = await params;

    // Fetch test attempt with all necessary details
    const attempt = await prisma.testAttempt.findUnique({
        where: {
            id: attemptId,
            userId: session.user.id, // Ensure user owns this attempt
        },
        include: {
            test: {
                include: {
                    testQuestions: {
                        include: {
                            question: true,
                        },
                        orderBy: {
                            sequence: 'asc',
                        },
                    },
                },
            },
        },
    });

    if (!attempt) {
        return notFound();
    }

    const { test } = attempt;
    const questions = test.testQuestions.map((tq) => tq.question);
    const userAnswers = attempt.answers || {};

    // Calculate detailed stats
    const totalQuestions = questions.length;
    let correctCount = 0;
    let skippedCount = 0;
    let incorrectCount = 0;

    const questionAnalysis = questions.map((question, index) => {
        const userAnswer = userAnswers[question.id];
        // Check if correct (simple check for MCQ)
        // Adjust logic based on question type (MCQ, Multiple Response, match, etc.)
        // Assuming simple string match for now or JSON match

        let isCorrect = false;
        let isSkipped = !userAnswer;

        if (!isSkipped) {
            if (question.type === 'mcq' || question.type === 'MULTIPLE_CHOICE') {
                // Parse options to check if we need to match by ID
                let parsedOptions = [];
                try {
                    parsedOptions = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
                } catch (e) { parsedOptions = []; }

                // Check if user answer matches correct answer directly
                // OR if it matches the ID of the correct option
                isCorrect = userAnswer === question.correctAnswer;

                if (!isCorrect && Array.isArray(parsedOptions)) {
                    // Try to find the option that matches the correct answer (by text or ID)
                    const correctOpt = parsedOptions.find(opt => {
                        const optId = typeof opt === 'object' ? opt.id : opt;
                        const optText = typeof opt === 'object' ? (opt.text || opt.value) : opt;
                        return String(optText) === String(question.correctAnswer) || String(optId) === String(question.correctAnswer);
                    });

                    // If we found the correct option object, check if user's answer matches its ID
                    if (correctOpt && typeof correctOpt === 'object') {
                        isCorrect = String(userAnswer) === String(correctOpt.id);
                    }
                }
            } else {
                // Fallback for other types
                isCorrect = userAnswer === question.correctAnswer;
            }
        }

        if (isCorrect) correctCount++;
        else if (isSkipped) skippedCount++;
        else incorrectCount++;

        return {
            ...question,
            userAnswer,
            isCorrect,
            isSkipped,
            number: index + 1,
        };
    });

    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const scorePercentage = attempt.percentage || accuracy;

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Link href="/dashboard" className="hover:text-primary flex items-center gap-1 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href={`/tests`} className="hover:text-primary transition-colors">
                            Tests
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold">{test.title} - Analysis</h1>
                    <p className="text-muted-foreground">
                        Attempted on {new Date(attempt.startedAt).toLocaleDateString()} •
                        Status: <span className="capitalize">{attempt.status}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/tests/${testId}`}>
                        <Button variant="outline">Retake Test</Button>
                    </Link>
                    <Button>Download Report</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                        <Award className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attempt.score}/{totalQuestions}</div>
                        <p className="text-xs text-muted-foreground">
                            {scorePercentage}% accuracy
                        </p>
                        <Progress value={scorePercentage} className="mt-2 h-1" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Taken</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.floor(attempt.timeSpentSeconds / 60)}m {attempt.timeSpentSeconds % 60}s
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg {(attempt.timeSpentSeconds / totalQuestions).toFixed(1)}s per question
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Performance</CardTitle>
                        <BarChart2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="flex flex-col">
                                <span className="text-green-600 font-bold text-lg">{correctCount}</span>
                                <span className="text-muted-foreground">Correct</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-red-600 font-bold text-lg">{incorrectCount}</span>
                                <span className="text-muted-foreground">Wrong</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500 font-bold text-lg">{skippedCount}</span>
                                <span className="text-muted-foreground">Skipped</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rank</CardTitle>
                        <Award className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">#{attempt.rank || '-'}</div>
                        <p className="text-xs text-muted-foreground">Global Rank</p>
                    </CardContent>
                </Card>
            </div>

            {/* Question Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Question Analysis</CardTitle>
                    <CardDescription>
                        Review your answers and explanations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {questionAnalysis.map((q) => (
                            <div key={q.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold flex-shrink-0">
                                            {q.number}
                                        </span>
                                        <div className="space-y-1">
                                            <p className="font-medium text-base">{q.text}</p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                                                <Badge variant="secondary" className="text-xs">{q.marks} Mark{q.marks !== 1 && 's'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {q.isCorrect && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Correct</Badge>}
                                        {!q.isCorrect && !q.isSkipped && <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Incorrect</Badge>}
                                        {q.isSkipped && <Badge variant="secondary">Skipped</Badge>}
                                    </div>
                                </div>

                                <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Options Display (if MCQ) */}
                                    {q.options && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Options:</p>
                                            {/* Assuming options is JSON string or object */}
                                            {(() => {
                                                let parsedOptions = [];
                                                try {
                                                    parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                                                } catch (e) {
                                                    // Fallback if regular array/string
                                                    parsedOptions = [];
                                                }

                                                if (Array.isArray(parsedOptions)) {
                                                    return parsedOptions.map((opt, idx) => {
                                                        // Handle different option formats (string or object with id/text)
                                                        const optText = typeof opt === 'object' ? opt.text || opt.value : opt;
                                                        const optId = typeof opt === 'object' ? opt.id : String.fromCharCode(65 + idx); // A, B, C...

                                                        const isSelected = q.userAnswer === optId || q.userAnswer === optText;
                                                        const isCorrectOpt = q.correctAnswer === optId || q.correctAnswer === optText;

                                                        let optionClass = "p-2 rounded border text-sm flex items-center justify-between transition-colors";
                                                        if (isCorrectOpt) optionClass += " bg-green-50 border-green-200 text-green-900 dark:bg-green-900/30 dark:border-green-800 dark:text-green-100";
                                                        else if (isSelected && !isCorrectOpt) optionClass += " bg-red-50 border-red-200 text-red-900 dark:bg-red-900/30 dark:border-red-800 dark:text-red-100";
                                                        else optionClass += " bg-background border-border opacity-70";

                                                        return (
                                                            <div key={idx} className={optionClass}>
                                                                <span><span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span> {optText}</span>
                                                                {isCorrectOpt && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                                {isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-600" />}
                                                            </div>
                                                        )
                                                    })
                                                }
                                                return <p className="text-sm text-muted-foreground">No options available to display.</p>
                                            })()}
                                        </div>
                                    )}

                                    {/* Summary & Explanation */}
                                    <div className="bg-muted/30 rounded p-4 text-sm h-full">
                                        <div className="mb-2">
                                            <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider mb-1">Your Answer</span>
                                            <p className={q.isCorrect ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                                {(() => {
                                                    // Display friendly text for user answer
                                                    let parsedOptions = [];
                                                    try {
                                                        parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                                                    } catch (e) { parsedOptions = []; }

                                                    if (Array.isArray(parsedOptions)) {
                                                        const selectedOpt = parsedOptions.find(opt => {
                                                            const optId = typeof opt === 'object' ? opt.id : opt;
                                                            return String(optId) === String(q.userAnswer);
                                                        });
                                                        if (selectedOpt) {
                                                            return typeof selectedOpt === 'object' ? (selectedOpt.text || selectedOpt.value) : selectedOpt;
                                                        }
                                                    }
                                                    return q.userAnswer || "Not Attempted";
                                                })()}
                                            </p>
                                        </div>
                                        {/* Only show correct answer if wrong */}
                                        {!q.isCorrect && (
                                            <div className="mb-3">
                                                <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider mb-1">Correct Answer</span>
                                                <p className="text-green-600 font-medium">
                                                    {(() => {
                                                        // Display friendly text for correct answer
                                                        let parsedOptions = [];
                                                        try {
                                                            parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                                                        } catch (e) { parsedOptions = []; }

                                                        if (Array.isArray(parsedOptions)) {
                                                            const correctOpt = parsedOptions.find(opt => {
                                                                const optId = typeof opt === 'object' ? opt.id : opt;
                                                                const optText = typeof opt === 'object' ? (opt.text || opt.value) : opt;
                                                                // Check if correct answer matches ID or Text
                                                                return String(optId) === String(q.correctAnswer) || String(optText) === String(q.correctAnswer);
                                                            });
                                                            if (correctOpt) {
                                                                return typeof correctOpt === 'object' ? (correctOpt.text || correctOpt.value) : correctOpt;
                                                            }
                                                        }
                                                        return q.correctAnswer;
                                                    })()}
                                                </p>
                                            </div>
                                        )}

                                        {q.explanation && (
                                            <div className="mt-4 pt-4 border-t border-border/50">
                                                <span className="font-semibold text-primary block text-xs uppercase tracking-wider mb-1">Explanation</span>
                                                <p className="text-muted-foreground">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
