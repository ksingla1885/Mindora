'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, GripVertical, CheckCircle2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { QuestionForm } from '@/components/admin/questions/QuestionForm';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function TestQuestionsManager({ testId }) {
    const { toast } = useToast();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Add Questions State
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFetchingAvailable, setIsFetchingAvailable] = useState(false);

    // Initial fetch
    useEffect(() => {
        fetchTestQuestions();
    }, [testId]);

    // Fetch questions already in the test
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

    // Fetch questions for the modal
    const fetchAvailableQuestions = async () => {
        try {
            setIsFetchingAvailable(true);
            // Fetch more questions for better searchability standard call
            const res = await fetch('/api/questions?limit=50&page=1');
            const data = await res.json();

            if (data.success) {
                // Filter out questions already in test
                const currentIds = new Set(questions.map(q => q.question.id));
                setAvailableQuestions(data.data.filter(q => !currentIds.has(q.id)));
            }
        } catch (error) {
            console.error('Failed to fetch available questions', error);
        } finally {
            setIsFetchingAvailable(false);
        }
    };

    // Trigger fetch when modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            fetchAvailableQuestions();
            setSelectedQuestions([]);
        }
    }, [isAddModalOpen]); // Removed 'questions' dependency to prevent refresh loops

    // Handlers
    const handleCreateQuestion = async (formData) => {
        try {
            // 1. Create Question
            const createRes = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || 'Failed to create question');

            // 2. Add to Test
            // 2. Add to Test
            const addRes = await fetch(`/api/tests/${testId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: [createData.data.id] }),
            });

            const addData = await addRes.json();
            if (!addRes.ok) throw new Error(addData.error || 'Failed to add question to test');

            toast({ title: 'Success', description: 'Question created and added.' });
            setIsAddModalOpen(false);
            fetchTestQuestions();
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleAddSelectedQuestions = async () => {
        if (selectedQuestions.length === 0) return;
        try {
            const res = await fetch(`/api/tests/${testId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: selectedQuestions }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add questions');

            toast({ title: 'Success', description: 'Questions added successfully.' });
            setSelectedQuestions([]);
            setIsAddModalOpen(false);
            fetchTestQuestions();
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to add questions.', variant: 'destructive' });
        }
    };

    const handleRemoveQuestion = async (questionId) => {
        if (!confirm('Are you sure you want to remove this question?')) return;
        try {
            const res = await fetch(`/api/tests/${testId}/questions/${questionId}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove');
            // Optimistic update
            setQuestions(prev => prev.filter(q => q.question.id !== questionId));
            toast({ title: 'Success', description: 'Question removed.' });

            // Re-fetch to ensure sequences are correct if backend doesn't normalize immediately
            // fetchTestQuestions(); 
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to remove question.', variant: 'destructive' });
        }
    };

    const handleUpdateMarks = async (questionId, newMarks) => {
        try {
            const res = await fetch(`/api/tests/${testId}/questions/${questionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marks: parseInt(newMarks) }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update marks');

            // Optimistic update
            setQuestions(prev => prev.map(q =>
                q.question.id === questionId ? { ...q, marks: parseInt(newMarks) } : q
            ));

            toast({ title: 'Success', description: 'Marks updated.' });
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to update marks.', variant: 'destructive' });
        }
    };

    // Drag and Drop reordering
    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        // Reorder locally first
        const items = Array.from(questions);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destinationIndex, 0, reorderedItem);

        // Update state locally
        const optimisticItems = items.map((item, index) => ({
            ...item,
            sequence: index + 1
        }));
        setQuestions(optimisticItems);

        try {
            // Determine the item that moved
            const movedQuestionId = reorderedItem.questionId;
            const newSequence = destinationIndex + 1; // 1-based sequence

            const res = await fetch(`/api/tests/${testId}/questions/${movedQuestionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sequence: newSequence }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reorder failed');

            // Ideally, we fetch fresh to ensure sync
            // fetchTestQuestions(); 
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: error.message || 'Failed to save order.', variant: 'destructive' });
            fetchTestQuestions(); // Revert
        }
    };

    const filteredAvailableQuestions = availableQuestions.filter(q =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.topic?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">Test Questions <span className="text-muted-foreground ml-2">({questions.length})</span></h3>
                    <Badge variant="outline" className="text-xs">
                        Total Marks: {questions.reduce((sum, q) => sum + (q.marks || 0), 0)}
                    </Badge>
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Add Questions
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Questions to Test</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="bank" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="bank">From Question Bank</TabsTrigger>
                                <TabsTrigger value="create">Create New</TabsTrigger>
                            </TabsList>

                            <TabsContent value="create" className="py-4">
                                <QuestionForm onSubmit={handleCreateQuestion} onSuccess={() => setIsAddModalOpen(false)} />
                            </TabsContent>

                            <TabsContent value="bank" className="py-4 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by question text or topic..."
                                        className="pl-9 h-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="border rounded-md max-h-[400px] min-h-[300px] overflow-y-auto">
                                    {isFetchingAvailable ? (
                                        <div className="flex justify-center items-center h-[300px]">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                    <TableHead>Question</TableHead>
                                                    <TableHead>Topic</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Def. Marks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAvailableQuestions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
                                                                        if (checked) setSelectedQuestions(prev => [...prev, q.id]);
                                                                        else setSelectedQuestions(prev => prev.filter(id => id !== q.id));
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="max-w-[300px]">
                                                                <div className="line-clamp-2 text-sm" dangerouslySetInnerHTML={{ __html: q.text }} />
                                                            </TableCell>
                                                            <TableCell><Badge variant="outline" className="text-[10px]">{q.topic?.name || 'N/A'}</Badge></TableCell>
                                                            <TableCell><Badge variant="secondary" className="text-[10px]">{q.type}</Badge></TableCell>
                                                            <TableCell>{q.marks}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
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

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="grid grid-cols-[60px_1fr_100px_100px_100px_80px] bg-muted/30 p-4 text-xs font-bold uppercase text-muted-foreground border-b border-border">
                    <div className="text-center">Order</div>
                    <div>Question</div>
                    <div>Topic</div>
                    <div>Type</div>
                    <div>Marks</div>
                    <div className="text-right">Action</div>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : questions.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">This test is currently empty. Click "Add Questions" to start building your test.</p>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="questions-list">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-border">
                                    {questions.map((item, index) => (
                                        <Draggable key={item.question.id} draggableId={item.question.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "grid grid-cols-[60px_1fr_100px_100px_100px_80px] p-4 items-center bg-card hover:bg-muted/5 transition-colors",
                                                        snapshot.isDragging && "shadow-lg ring-1 ring-primary/20 bg-background z-50 rounded-lg"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" {...provided.dragHandleProps}>
                                                        {index + 1}
                                                        {/* <GripVertical className="h-4 w-4" /> */}
                                                    </div>
                                                    <div className="pr-4">
                                                        <div className="line-clamp-2 text-sm font-medium" dangerouslySetInnerHTML={{ __html: item.question.text }} />
                                                    </div>
                                                    <div>
                                                        <Badge variant="outline" className="text-[10px] truncate max-w-[90px]">
                                                            {item.question.topic?.name || 'General'}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                                            {item.question.type.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type="number"
                                                            className="h-8 w-16 text-center"
                                                            defaultValue={item.marks || item.question.marks}
                                                            onBlur={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (val !== item.marks) handleUpdateMarks(item.question.id, val);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveQuestion(item.question.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>
        </div>
    );
}
