
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Helper to create a new question structure
const createNewQuestion = () => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'MCQ', // MCQ, TRUE_FALSE, SHORT_ANSWER
    text: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A', // Default for MCQ
    explanation: '',
});

export default function CreateDPPPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dppId = searchParams.get('id');
    const isEditMode = !!dppId;

    const [isLoading, setIsLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('12');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Initialize with 1 empty question
    const [questions, setQuestions] = useState([createNewQuestion()]);

    useEffect(() => {
        fetchSubjects(selectedClass);
    }, [selectedClass]);

    useEffect(() => {
        if (dppId) {
            fetchDPPDetails(dppId);
        }
    }, [dppId]);

    const fetchDPPDetails = async (id) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/admin/dpp/${id}`);
            if (!res.ok) throw new Error('Failed to fetch DPP details');

            const data = await res.json();

            // Populate form
            setDate(new Date(data.date).toISOString().split('T')[0]);
            setSelectedClass(data.class);
            setSelectedSubject(data.subjectId);

            // Map questions
            // API returns: { questions: [ { order, question: { ... } } ] }
            const mappedQuestions = data.questions.map(qItem => {
                const q = qItem.question;

                // Map DB type back to UI type
                const typeMap = { 'mcq': 'MCQ', 'true_false': 'TRUE_FALSE', 'short_answer': 'SHORT_ANSWER' };

                return {
                    id: q.id, // Keep ID to potentially use key, though we treat as new on submit
                    type: typeMap[q.type] || 'MCQ',
                    text: q.text,
                    options: q.options || { A: '', B: '', C: '', D: '' },
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || ''
                };
            });

            if (mappedQuestions.length > 0) {
                setQuestions(mappedQuestions);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load DPP details");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubjects = async (className) => {
        try {
            const query = className ? `?class=${className}` : '';
            const res = await fetch(`/api/admin/subjects${query}`);
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
                if (data.length > 0) {
                    setSelectedSubject(data[0].id);
                } else {
                    setSelectedSubject('');
                }
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };

        // Reset correct answer if type changes
        if (field === 'type') {
            if (value === 'MCQ') {
                newQuestions[index].options = { A: '', B: '', C: '', D: '' };
                newQuestions[index].correctAnswer = 'A';
            } else if (value === 'TRUE_FALSE') {
                newQuestions[index].options = null;
                newQuestions[index].correctAnswer = 'true';
            } else {
                newQuestions[index].options = null;
                newQuestions[index].correctAnswer = '';
            }
        }

        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, optionKey, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options = { ...newQuestions[qIndex].options, [optionKey]: value };
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, createNewQuestion()]);
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) {
            toast.error("At least one question is required");
            return;
        }
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        if (!selectedSubject) {
            toast.error('Please select a subject');
            return;
        }

        if (!questions[0].text) {
            toast.error('Please fill in at least the first question');
            return;
        }

        try {
            setIsLoading(true);
            const payload = {
                date,
                class: selectedClass,
                subjectId: selectedSubject,
                questions: questions.filter(q => q.text.trim() !== '')
            };

            const url = isEditMode ? `/api/admin/dpp/${dppId}` : '/api/admin/dpp';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(isEditMode ? 'Failed to update DPP' : 'Failed to create DPP');

            toast.success(isEditMode ? 'DPP updated successfully' : 'DPP created successfully');
            router.push('/admin/dpp');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create DPP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dpp">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">{isEditMode ? 'Edit DPP' : 'Create New DPP'}</h2>
                        <p className="text-sm text-muted-foreground">{isEditMode ? 'Modify existing practice questions.' : 'Add practice questions for students.'}</p>
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary text-white font-bold shadow-lg shadow-primary/20">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isEditMode ? 'Update DPP' : 'Save DPP'}
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Basic Info Card */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>DPP Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Class</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="9">Class 9</SelectItem>
                                    <SelectItem value="10">Class 10</SelectItem>
                                    <SelectItem value="11">Class 11</SelectItem>
                                    <SelectItem value="12">Class 12</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
                    </CardContent>
                </Card>

                {/* Questions */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xl font-bold">Questions ({questions.length})</h3>
                        <Button onClick={addQuestion} variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Question
                        </Button>
                    </div>

                    {questions.map((question, index) => (
                        <Card key={question.id} className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30 border-b border-border">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">
                                        {index + 1}
                                    </span>
                                    Question {index + 1}
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-sm font-medium">Question Text</label>
                                        <Textarea
                                            placeholder="Enter question text..."
                                            value={question.text}
                                            onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <Select
                                            value={question.type}
                                            onValueChange={(val) => handleQuestionChange(index, 'type', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MCQ">MCQ</SelectItem>
                                                <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                                <SelectItem value="SHORT_ANSWER">Short Answer (1 Word)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {question.type === 'MCQ' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {['A', 'B', 'C', 'D'].map((opt) => (
                                            <div key={opt} className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground">Option {opt}</label>
                                                <Input
                                                    placeholder={`Option ${opt} text`}
                                                    value={question.options[opt]}
                                                    onChange={(e) => handleOptionChange(index, opt, e.target.value)}
                                                    className={question.correctAnswer === opt ? "border-emerald-500 ring-1 ring-emerald-500/20" : ""}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-emerald-600">Correct Answer</label>

                                        {question.type === 'MCQ' && (
                                            <Select
                                                value={question.correctAnswer}
                                                onValueChange={(val) => handleQuestionChange(index, 'correctAnswer', val)}
                                            >
                                                <SelectTrigger className="border-emerald-200 bg-emerald-50/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A">Option A</SelectItem>
                                                    <SelectItem value="B">Option B</SelectItem>
                                                    <SelectItem value="C">Option C</SelectItem>
                                                    <SelectItem value="D">Option D</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {question.type === 'TRUE_FALSE' && (
                                            <Select
                                                value={question.correctAnswer}
                                                onValueChange={(val) => handleQuestionChange(index, 'correctAnswer', val)}
                                            >
                                                <SelectTrigger className="border-emerald-200 bg-emerald-50/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">True</SelectItem>
                                                    <SelectItem value="false">False</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {question.type === 'SHORT_ANSWER' && (
                                            <Input
                                                placeholder="Enter the correct answer"
                                                value={question.correctAnswer}
                                                onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                                                className="border-emerald-200 bg-emerald-50/50"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Explanation</label>
                                        <Textarea
                                            placeholder="Explain the solution..."
                                            value={question.explanation}
                                            onChange={(e) => handleQuestionChange(index, 'explanation', e.target.value)}
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button onClick={addQuestion} variant="outline" className="w-full py-8 border-dashed border-2 hover:border-primary/50 text-muted-foreground hover:text-primary gap-2">
                        <Plus className="h-5 w-5" />
                        Add Another Question
                    </Button>
                </div>
            </div>
        </div>
    );
}
