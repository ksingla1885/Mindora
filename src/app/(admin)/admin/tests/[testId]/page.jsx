'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TestForm } from '../_components/test-form';
import { TestQuestionsManager } from '../_components/test-questions-manager';
import { toast } from '@/components/ui/use-toast';

export default function TestDetailsPage({ params }) {
    const { testId } = use(params);
    const router = useRouter();
    const [test, setTest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/tests/${testId}`);
                const data = await res.json();

                if (data.success) {
                    // Flatten/Process data if needed for the form
                    const testData = data.data;

                    // Ensure dates are date objects for the form
                    if (testData.startTime) testData.startTime = new Date(testData.startTime);
                    if (testData.endTime) testData.endTime = new Date(testData.endTime);

                    setTest(testData);
                } else {
                    toast({
                        title: 'Error',
                        description: data.error || 'Failed to fetch test details',
                        variant: 'destructive',
                    });
                    router.push('/admin/tests');
                }
            } catch (error) {
                console.error('Failed to fetch test', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load test details',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (testId) {
            fetchTest();
        }
    }, [testId, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!test) return null;

    return (
        <div className="container mx-auto py-6 px-4 max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    <p className="text-muted-foreground text-sm">Manage test details and questions</p>
                </div>
            </div>

            <Tabs defaultValue="questions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="settings">Settings & Details</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="bg-card border rounded-xl p-6 shadow-sm">
                    <TestQuestionsManager testId={testId} />
                </TabsContent>

                <TabsContent value="settings" className="bg-card border rounded-xl p-6 shadow-sm">
                    <TestForm test={test} onSuccess={(updatedTest) => {
                        setTest(updatedTest);
                        toast({ title: "Success", description: "Test updated successfully." });
                    }} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
