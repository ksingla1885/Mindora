'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Dynamically import TestTaker
const TestTaker = dynamic(
    () => import('@/components/tests/TestTaker').then((mod) => mod.TestTaker),
    {
        ssr: false,
        loading: () => (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }
);

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
    const [error, setError] = useState(null);

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
            } catch (err) {
                console.error('Error fetching DPP:', err);
                setError(err.message || 'Failed to load DPP');
            } finally {
                setLoading(false);
            }
        };

        fetchDPP();
    }, [dppId, status]);

    const handleComplete = async (results) => {
        // Submit results to DPP endpoint
        try {
            // TestTaker handles submission internally to /api/attempts/submit
            // But for DPP we might want to use a specific endpoint or just redirect
            // If TestTaker uses generic attempt API, it might work if we map DPP to Test structure

            // For now, let's assume TestTaker handles the submission and we just redirect
            router.push('/dpp');
        } catch (error) {
            console.error('Error completing DPP:', error);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Loading practice problem...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="ml-2">
                        {error}
                        <div className="mt-4">
                            <Button onClick={() => router.push('/dpp')} variant="outline">
                                Back to DPP
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Map DPP data to Test format expected by TestTaker
    const testData = {
        id: dpp.id,
        title: dpp.title,
        durationMinutes: dpp.duration || 30, // Default to 30 mins if not specified
        questions: dpp.questions || [],
        type: 'DPP'
    };

    // Construct initialAttempt to prevent TestTaker from creating a new attempt
    const initialAttempt = {
        id: dpp.id, // Use assignment ID as attempt ID
        testId: dpp.id,
        userId: session?.user?.id,
        timeLeft: dpp.duration * 60,
        answers: dpp.userAnswer && dpp.questions.length > 0 ? { [dpp.questions[0].id]: dpp.userAnswer } : {},
        flaggedQuestions: {},
        timeSpent: {},
        startedAt: new Date().toISOString(),
        status: dpp.isCompleted ? 'submitted' : 'in-progress'
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <TestTaker
                    test={testData}
                    questions={dpp.questions}
                    onComplete={handleComplete}
                    initialAttempt={initialAttempt}
                    apiBaseUrl="/api/dpp/attempts"
                />
            </div>
        </div>
    );
}
