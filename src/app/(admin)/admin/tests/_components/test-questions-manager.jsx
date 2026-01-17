'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { QuestionForm } from '@/components/admin/questions/QuestionForm';
import { Checkbox } from '@/components/ui/checkbox';

export function TestQuestionsManager({ testId }) {
    const { toast } = useToast();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch test questions
    const fetchTestQuestions = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/tests/${testId}/questions`);
            const data = await res.json();
            if (data.success) {
                setQuestions(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch test questions', error);
            toast({
                title: 'Error',
                description: 'Failed to load test questions.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch available questions for the bank
    const fetchAvailableQuestions = async () => {
        try {
            const res = await fetch('/api/questions?limit=100'); // Fetch mostly recent ones
            const data = await res.json();
            // Filter out questions already in the test
            const currentIds = new Set(questions.map(q => q.question.id));
            setAvailableQuestions(data.data.filter(q => !currentIds.has(q.id)) || []);
        } catch (error) {
            console.error('Failed to fetch available questions', error);
        }
    };

    useEffect(() => {
        fetchTestQuestions();
    }, [testId]);

    useEffect(() => {
        if (isAddModalOpen) {
            fetchAvailableQuestions();
        }
    }, [isAddModalOpen, questions]);

    const handleCreateQuestion = async (formData) => {
        try {
            // 1. Create the question
            const createRes = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const createData = await createRes.json();

            if (!createRes.ok) throw new Error(createData.error || 'Failed to create question');

            // 2. Add to test
            const addRes = await fetch(`/api/tests/${testId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: [createData.data.id] }),
            });

            if (!addRes.ok) throw new Error('Failed to add question to test');

            toast({
                title: 'Success',
                description: 'Question created and added to test.',
            });

            setIsAddModalOpen(false);
            fetchTestQuestions();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
            throw error; // Re-throw for the form handling
        }
    };

    const handleAddSelectedQuestions = async () => {
        try {
            if (selectedQuestions.length === 0) return;

            const res = await fetch(`/api/tests/${testId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: selectedQuestions }),
            });

            if (!res.ok) throw new Error('Failed to add questions');

            toast({
                title: 'Success',
                description: 'Questions added successfully.',
            });

            setSelectedQuestions([]);
            setIsAddModalOpen(false);
            fetchTestQuestions();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add questions to test.',
                variant: 'destructive',
            });
        }
    };

    const handleRemoveQuestion = async (questionId) => {
        // TODO: Implement remove endpoint logic (might need a new DELETE endpoint on the relationship)
        // For now, assuming direct link removal isn't exposed yet, but we can simulate or placeholder.
        // The previous file analysis showed DELETE /api/tests/[testId] deletes test, 
        // but didn't explicitly show DELETE /api/tests/[testId]/questions/[questionId]
        // We will skip implementation or add a placeholder toast.
        toast({
            title: "Info",
            description: "Removing questions from test is not fully implemented in this demo.",
        })
    }

    const filteredAvailableQuestions = availableQuestions.filter(q =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Test Questions ({questions.length})</h3>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Questions
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Questions to Test</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="create" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="create">Create New</TabsTrigger>
                                <TabsTrigger value="bank">From Question Bank</TabsTrigger>
                            </TabsList>

                            <TabsContent value="create" className="py-4">
                                <QuestionForm onSubmit={handleCreateQuestion} />
                            </TabsContent>

                            <TabsContent value="bank" className="py-4 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search questions..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="border rounded-md max-h-[400px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Question</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Marks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAvailableQuestions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                        No matching questions found in the bank.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredAvailableQuestions.map((q) => (
                                                    <TableRow key={q.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedQuestions.includes(q.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) setSelectedQuestions([...selectedQuestions, q.id]);
                                                                    else setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium line-clamp-2 max-w-[300px]">
                                                            <div dangerouslySetInnerHTML={{ __html: q.text }} />
                                                        </TableCell>
                                                        <TableCell><Badge variant="outline">{q.type}</Badge></TableCell>
                                                        <TableCell>{q.marks}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddSelectedQuestions} disabled={selectedQuestions.length === 0}>
                                        Add Selected ({selectedQuestions.length})
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Seq</TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No questions added to this test yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            questions.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="max-w-[400px]">
                                        <div className="line-clamp-2" dangerouslySetInnerHTML={{ __html: item.question.text }} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.question.type}</Badge>
                                    </TableCell>
                                    <TableCell>{item.question.marks}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(item.question.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
