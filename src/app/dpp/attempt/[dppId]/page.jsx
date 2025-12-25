'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Loader2,
    AlertCircle,
    ChevronLeft,
    Clock,
    Send,
    CheckCircle2,
    XCircle,
    HelpCircle,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils'; // Assuming standard utils

export default function DPPAttemptPage({ params }) {
    const { dppId } = params;
    const router = useRouter();
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push(`/auth/signin?callbackUrl=/dpp/attempt/${dppId}`);
        },
    });

    const [dpp, setDpp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // State for the problem
    const [selectedOption, setSelectedOption] = useState(null);
    const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Timer
    useEffect(() => {
        if (!isSubmitted && !loading && dpp) {
            const timer = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isSubmitted, loading, dpp]);

    // Fetch Data
    useEffect(() => {
        const fetchDPP = async () => {
            if (status !== 'authenticated') return;

            try {
                setLoading(true);
                const response = await fetch(`/api/dpp/${dppId}`);

                if (!response.ok) {
                    throw new Error('Failed to load DPP');
                }

                const data = await response.json();
                setDpp(data);

                // If already completed, set state
                if (data.isCompleted) {
                    setIsSubmitted(true);
                    // potentially fetch result or set from data
                }

            } catch (err) {
                console.error('Error fetching DPP:', err);
                setError(err.message || 'Failed to load DPP');
            } finally {
                setLoading(false);
            }
        };

        fetchDPP();
    }, [dppId, status]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (submitting) return;

        const question = dpp?.questions?.[0];
        if (!question) return;

        const answer = question.type === 'MCQ' ? selectedOption : subjectiveAnswer;

        if (!answer) return; // Prevent empty submit

        try {
            setSubmitting(true);

            // This endpoint might need to be adjusted based on actual backend route
            const response = await fetch(`/api/dpp/${dppId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answer: answer,
                    timeSpent: timeElapsed
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            const resultData = await response.json();
            setResult(resultData);
            setIsSubmitted(true);

        } catch (error) {
            console.error('Error submitting:', error);
            // Fallback for demo validity if API fails
            // In a real app, show error message
            setError('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !dpp || !dpp.questions || dpp.questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Unavailable</h2>
                <p className="text-muted-foreground mb-4">{error || "Problem not found."}</p>
                <Button variant="outline" onClick={() => router.push('/dpp')}>Go Back</Button>
            </div>
        );
    }

    const question = dpp.questions[0]; // Focusing on "One Problem"
    const options = question.options || (question.type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : []);

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* 1. Navbar / Top Bar */}
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/dpp" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-semibold text-foreground uppercase tracking-widest ">Daily Practice</h1>
                        <span className="text-xs text-muted-foreground">{dpp.subject} • {dpp.difficulty || 'Medium'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full font-mono text-sm font-medium text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatTime(timeElapsed)}</span>
                </div>
            </header>

            {/* 2. Main Content Area */}
            <main className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full p-4 sm:p-8 pb-32">

                {/* Question Card */}
                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-serif font-medium leading-normal text-foreground">
                            {question.text || dpp.title}
                        </h2>
                    </div>

                    <div className="w-full h-px bg-border/50" />

                    {/* Interaction Area */}
                    <div className="space-y-4">
                        {question.type === 'MCQ' || options.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {options.map((opt, idx) => {
                                    const isSelected = selectedOption === opt;
                                    const isResultState = isSubmitted;

                                    let variantClass = "border-border hover:border-primary/50 hover:bg-muted/30";

                                    if (isResultState) {
                                        if (result?.correctAnswer === opt) {
                                            variantClass = "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 ring-1 ring-green-500";
                                        } else if (isSelected && result?.correctAnswer !== opt) {
                                            variantClass = "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 ring-1 ring-red-500";
                                        } else {
                                            variantClass = "opacity-50 grayscale";
                                        }
                                    } else if (isSelected) {
                                        variantClass = "border-primary bg-primary/5 ring-1 ring-primary shadow-sm";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            disabled={isSubmitted}
                                            onClick={() => setSelectedOption(opt)}
                                            className={`
                                                relative w-full p-6 text-left rounded-xl border-2 transition-all duration-200
                                                group flex items-center gap-4
                                                ${variantClass}
                                            `}
                                        >
                                            <div className={`
                                                flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors
                                                ${isSelected || (isResultState && result?.correctAnswer === opt) ? 'border-transparent bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50'}
                                                ${isResultState && result?.correctAnswer === opt ? '!bg-green-600 !text-white' : ''}
                                                ${isResultState && isSelected && result?.correctAnswer !== opt ? '!bg-red-500 !text-white !border-transparent' : ''}
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-lg font-medium">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <textarea
                                    disabled={isSubmitted}
                                    value={subjectiveAnswer}
                                    onChange={(e) => setSubjectiveAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full min-h-[200px] p-6 rounded-xl border-2 border-border bg-card text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground/50"
                                />
                            </div>
                        )}
                    </div>

                    {/* Feedback Section */}
                    {isSubmitted && result && (
                        <div className="mt-8 rounded-2xl bg-card border border-border overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className={`p-1 h-2 w-full ${result.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    {result.isCorrect ? (
                                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                            <XCircle className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold dark:text-white text-black">
                                            {result.isCorrect ? 'Excellent! Spot on.' : 'Not quite right.'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {result.isCorrect ? 'You nailed the concept.' : 'Review the solution below to learn from this.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-6">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4" /> Explanation
                                    </h4>
                                    <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed">
                                        <p>{result.explanation || "No explanation provided for this problem."}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button variant="outline" className="flex-1 h-12" onClick={() => router.push('/dpp')}>
                                        Back to Dashboard
                                    </Button>
                                    <Button className="flex-1 h-12" onClick={() => router.push('/dpp')}>
                                        Try Similar Problem <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* 3. Sticky Bottom Bar */}
            {!isSubmitted && (
                <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 pb-6 z-20">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                        <div className="hidden sm:block text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Tip:</span> Read the question twice before answering.
                        </div>
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            disabled={(!selectedOption && !subjectiveAnswer) || submitting}
                            className="w-full sm:w-auto min-w-[200px] h-12 text-base shadow-lg hover:shadow-xl transition-all"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Send className="w-5 h-5 mr-2" />
                            )}
                            {submitting ? 'Checking...' : 'Submit Answer'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
