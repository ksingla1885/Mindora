'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';

export default function QuestionForm({ onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);

    // Form States
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState('mcq');
    const [difficulty, setDifficulty] = useState('medium');
    const [marks, setMarks] = useState(4);
    const [explanation, setExplanation] = useState('');
    const [options, setOptions] = useState([
        { id: '1', text: '' },
        { id: '2', text: '' },
        { id: '3', text: '' },
        { id: '4', text: '' }
    ]);
    const [correctAnswer, setCorrectAnswer] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            const data = await res.json();
            if (data.success) {
                setSubjects(data.data);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch subjects"
                });
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch subjects"
            });
        } finally {
            setFetchingData(false);
        }
    };

    const handleSubjectChange = (subjectId) => {
        setSelectedSubject(subjectId);
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            setTopics(subject.topics || []);
        } else {
            setTopics([]);
        }
        setSelectedTopic('');
    };

    const handleOptionChange = (id, text) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
    };

    const addOption = () => {
        const newId = (options.length + 1).toString();
        setOptions([...options, { id: newId, text: '' }]);
    };

    const removeOption = (id) => {
        if (options.length <= 2) {
            toast({
                variant: 'destructive',
                title: 'Cannot remove option',
                description: 'A question must have at least 2 options.'
            });
            return;
        }
        setOptions(options.filter(opt => opt.id !== id));
        if (correctAnswer === id) {
            setCorrectAnswer('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!selectedSubject || !selectedTopic) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please select a subject and topic.' });
            return;
        }
        if (!questionText.trim()) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please enter the question text.' });
            return;
        }
        if (questionType === 'mcq') {
            const validOptions = options.filter(opt => opt.text.trim());
            if (validOptions.length < 2) {
                toast({ variant: 'destructive', title: 'Invalid options', description: 'Please provide at least 2 valid options.' });
                return;
            }
            if (!correctAnswer) {
                toast({ variant: 'destructive', title: 'Missing answer', description: 'Please select the correct answer.' });
                return;
            }
            const selectedOption = options.find(o => o.id === correctAnswer); // Check if selected option has text
            if (!selectedOption || !selectedOption.text.trim()) {
                toast({ variant: 'destructive', title: 'Invalid answer', description: 'Selected correct answer cannot be empty.' });
                return;
            }
        }

        setLoading(true);

        const payload = {
            topicId: selectedTopic,
            text: questionText,
            type: questionType,
            difficulty,
            marks: parseInt(marks),
            explanation,
            options: questionType === 'mcq' ? options.filter(opt => opt.text.trim()) : null,
            correctAnswer: questionType === 'mcq' ? options.find(o => o.id === correctAnswer)?.text : correctAnswer // Store exact text as answer for now or ID? Schema says string. Often text is better if IDs are transient. Let's start with Text match or maybe just ID if we stored structured JSON. 
            // The schema says `options Json?`. Let's store the whole options array stringified or as JSON object.
            // And correctAnswer as String.
            // Ideally, store the option text as correct answer to be robust against reordering if just array.
            // Or store the index/ID. Let's store the Text of the correct answer to be safe?
            // Wait, if I edit the option text, the correct answer logic might break if I store text.
            // Let's store the text of the correct answer for simplicity as `correctAnswer` in DB is String.
        };

        // Refinement: Store options object.
        // options: [{id: '1', text: '...'}, ...]

        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Question added successfully"
                });
                onSuccess();
            } else {
                throw new Error(data.error || "Failed to add question");
            }
        } catch (error) {
            console.error("Error adding question:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Something went wrong'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={fetchingData}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Topic</Label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={!selectedSubject}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {topics.map(topic => (
                                <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                    placeholder="Enter your question here..."
                    className="min-h-[100px]"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={questionType} onValueChange={setQuestionType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                            <SelectItem value="long_answer">Long Answer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                        type="number"
                        min="1"
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                    />
                </div>
            </div>

            {questionType === 'mcq' && (
                <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-8 text-xs">
                            <Plus className="size-3 mr-1" /> Add Option
                        </Button>
                    </div>

                    <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer} className="space-y-3">
                        {options.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-3">
                                <RadioGroupItem value={option.id} id={`opt-${option.id}`} />
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        placeholder={`Option ${index + 1}`}
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                        className={correctAnswer === option.id ? "border-primary ring-1 ring-primary/20" : ""}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => removeOption(option.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
                </div>
            )}

            <div className="space-y-2">
                <Label>Explanation (Optional)</Label>
                <Textarea
                    placeholder="Explain the solution..."
                    className="min-h-[80px]"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-blue-600">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Question'
                    )}
                </Button>
            </div>
        </form>
    );
}
