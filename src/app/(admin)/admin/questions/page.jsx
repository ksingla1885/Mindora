'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    FileQuestion,
    Clock,
    Filter,
    Download,
    Upload,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    CheckCircle2,
    MoreVertical,
    Loader2,
    Copy,
    AlertTriangle,
    Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import QuestionForm from './_components/question-form';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function QuestionManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    // Delete Confirmation States
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUsedInTests, setIsUsedInTests] = useState(false);

    // Bulk Delete Selection States
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkUsedInTests, setIsBulkUsedInTests] = useState(false);

    const toggleSelectQuestion = (id) => {
        setSelectedQuestionIds(prev => 
            prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedQuestionIds.length === questions.length) {
            setSelectedQuestionIds([]);
        } else {
            setSelectedQuestionIds(questions.map(q => q.id));
        }
    };

    const handleEdit = (question) => {
        setEditingQuestion(question);
        setIsFormOpen(true);
    };

    const handleDelete = (question) => {
        setQuestionToDelete(question);
        setIsUsedInTests(false);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async (force = false) => {
        if (!questionToDelete) return;
        setIsDeleting(true);
        try {
            const url = `/api/questions/${questionToDelete.id}${force ? '?force=true' : ''}`;
            const res = await fetch(url, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: "Success",
                    description: force 
                        ? "Question was removed from tests and deleted successfully."
                        : "Question deleted successfully."
                });
                setIsDeleteOpen(false);
                setQuestionToDelete(null);
                setIsUsedInTests(false);
                fetchQuestions();
            } else {
                if (data.code === 'USED_IN_TESTS') {
                    setIsUsedInTests(true);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Deletion Prevented",
                        description: data.error || "Failed to delete question."
                    });
                    setIsDeleteOpen(false);
                    setQuestionToDelete(null);
                    setIsUsedInTests(false);
                }
            }
        } catch (error) {
            console.error("Network error deleting question:", error);
            toast({
                variant: "destructive",
                title: "Network Error",
                description: "Failed to delete question due to a network connection issue."
            });
            setIsDeleteOpen(false);
            setQuestionToDelete(null);
            setIsUsedInTests(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmBulkDelete = async (force = false) => {
        if (selectedQuestionIds.length === 0) return;
        setIsBulkDeleting(true);
        try {
            const url = `/api/questions/bulk${force ? '?force=true' : ''}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: selectedQuestionIds })
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: "Success",
                    description: force 
                        ? `Selected questions were unlinked from tests and deleted successfully.`
                        : `Successfully deleted ${selectedQuestionIds.length} question(s).`
                });
                setIsBulkDeleteOpen(false);
                setSelectedQuestionIds([]);
                setIsBulkUsedInTests(false);
                fetchQuestions();
            } else {
                if (data.code === 'USED_IN_TESTS') {
                    setIsBulkUsedInTests(true);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Deletion Prevented",
                        description: data.error || "Failed to delete selected questions."
                    });
                    setIsBulkDeleteOpen(false);
                    setSelectedQuestionIds([]);
                    setIsBulkUsedInTests(false);
                }
            }
        } catch (error) {
            console.error("Network error bulk deleting questions:", error);
            toast({
                variant: "destructive",
                title: "Network Error",
                description: "Failed to delete selected questions due to a network connection issue."
            });
            setIsBulkDeleteOpen(false);
            setSelectedQuestionIds([]);
            setIsBulkUsedInTests(false);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        toast({
            title: "Copied",
            description: "Question ID copied to clipboard."
        });
    };

    const handleDuplicate = (question) => {
        const duplicated = {
            ...question,
            id: undefined,
        };
        setEditingQuestion(duplicated);
        setIsFormOpen(true);
    };

    const handleToggleActive = async (question) => {
        const newStatus = question.isActive === false ? true : false;
        try {
            const res = await fetch(`/api/questions/${question.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: "Status Updated",
                    description: `Question has been ${newStatus ? 'activated' : 'deactivated'} successfully.`
                });
                fetchQuestions();
            } else {
                throw new Error(data.error || "Failed to update status.");
            }
        } catch (error) {
            console.error("Error toggling question status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update status."
            });
        }
    };

    // AI Generation State
    const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [aiConfig, setAiConfig] = useState({
        topic: '',
        subjectId: '',
        count: 5,
        difficulty: 'medium'
    });

    // Import/Export State
    const [stats, setStats] = useState([
        { label: 'Total Questions', value: '0', trend: 'No questions', trendUp: null, icon: FileQuestion },
        { label: 'Unreviewed', value: '0', trend: 'No pending', trendUp: null, icon: Clock }
    ]);


    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/questions?limit=100'); // Increased limit for now
            const data = await res.json();
            if (data.success) {
                setQuestions(data.data);
                setStats([
                    { label: 'Total Questions', value: data.meta.total.toString(), trend: 'Updated just now', trendUp: true, icon: FileQuestion },
                    { label: 'Unreviewed', value: '0', trend: 'All reviewed', trendUp: true, icon: Clock }
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load questions."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            const data = await res.json();
            if (data.success) {
                setSubjects(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        }
    };

    // Export Functionality
    const handleExport = () => {
        if (!questions.length) {
            toast({ title: "No Data", description: "No questions to export." });
            return;
        }

        const headers = ['Text', 'Type', 'Difficulty', 'Topic', 'Marks'];
        const csvContent = [
            headers.join(','),
            ...questions.map(q => {
                const row = [
                    `"${q.text.replace(/"/g, '""')}"`,
                    q.type,
                    q.difficulty,
                    `"${q.topic?.name || ''}"`,
                    q.marks
                ];
                return row.join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `question_bank_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Export Successful", description: "Question bank exported to CSV." });
    };

    // Import Functionality
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            try {
                // Robust CSV parsing function that handles quotes, escaped quotes (""), commas, and newlines in cells
                const parseCSV = (csvText) => {
                    let p = '', c = '', r = [];
                    let q = false;
                    let row = [''];
                    for (let i = 0; i < csvText.length; i++) {
                        c = csvText[i];
                        let next = csvText[i + 1];
                        if (c === '"') {
                            if (q && next === '"') {
                                row[row.length - 1] += '"';
                                i++;
                            } else {
                                q = !q;
                            }
                        } else if (c === ',' && !q) {
                            row.push('');
                        } else if ((c === '\r' || c === '\n') && !q) {
                            if (c === '\r' && next === '\n') {
                                i++;
                            }
                            r.push(row);
                            row = [''];
                        } else {
                            row[row.length - 1] += c;
                        }
                    }
                    if (row.length > 1 || row[0] !== '') {
                        r.push(row);
                    }
                    return r;
                };

                const csvRows = parseCSV(text).filter(row => row.some(cell => cell.trim() !== ''));
                if (csvRows.length < 2) {
                    throw new Error("File empty or invalid: Need at least a header row and one data row.");
                }

                // Match header names case-insensitively
                const headers = csvRows[0].map(h => h.trim().toLowerCase());
                
                const textIndex = headers.findIndex(h => ['text', 'question', 'question text', 'question_text'].includes(h));
                const typeIndex = headers.findIndex(h => ['type', 'question type', 'question_type'].includes(h));
                const difficultyIndex = headers.findIndex(h => ['difficulty'].includes(h));
                const marksIndex = headers.findIndex(h => ['marks', 'mark', 'score'].includes(h));
                const explanationIndex = headers.findIndex(h => ['explanation', 'explanation text', 'explanation_text', 'solution'].includes(h));
                const subjectIndex = headers.findIndex(h => ['subject', 'subject name', 'subject_name', 'subject id', 'subject_id'].includes(h));
                const topicIndex = headers.findIndex(h => ['topic', 'topic name', 'topic_name', 'topic id', 'topic_id'].includes(h));
                const answerIndex = headers.findIndex(h => ['correctanswer', 'correct answer', 'correct_answer', 'correct', 'answer'].includes(h));

                if (textIndex === -1) {
                    throw new Error("CSV must contain a 'Question' or 'Text' column.");
                }

                // Identify potential option columns (e.g. Option A, Option B, A, B, Option 1, etc.)
                const optionHeaderMappings = [];
                const standardHeaders = [
                    'text', 'question', 'question text', 'question_text',
                    'type', 'question type', 'question_type',
                    'difficulty', 'marks', 'mark', 'score',
                    'explanation', 'explanation text', 'explanation_text', 'solution',
                    'subject', 'subject name', 'subject_name', 'subject id', 'subject_id',
                    'topic', 'topic name', 'topic_name', 'topic id', 'topic_id',
                    'correctanswer', 'correct answer', 'correct_answer', 'correct', 'answer'
                ];

                headers.forEach((h, idx) => {
                    if (h.startsWith('option')) {
                        const label = h.replace(/^option\s*(_)?/i, '').trim();
                        optionHeaderMappings.push({ index: idx, label });
                    } else if (['a', 'b', 'c', 'd', 'e', 'f', '1', '2', '3', '4', '5'].includes(h)) {
                        if (!standardHeaders.includes(h)) {
                            optionHeaderMappings.push({ index: idx, label: h });
                        }
                    }
                });

                // Sort mappings by header index to keep options ordered (A, B, C, D)
                optionHeaderMappings.sort((a, b) => a.index - b.index);

                const questionsToImport = [];
                for (let i = 1; i < csvRows.length; i++) {
                    const row = csvRows[i];
                    if (row.length === 0 || !row[textIndex]?.trim()) continue;

                    const textVal = row[textIndex].trim();
                    const typeVal = typeIndex !== -1 && row[typeIndex] ? row[typeIndex].trim().toLowerCase() : 'mcq';
                    const difficultyVal = difficultyIndex !== -1 && row[difficultyIndex] ? row[difficultyIndex].trim().toLowerCase() : 'medium';
                    const marksVal = marksIndex !== -1 && row[marksIndex] ? parseInt(row[marksIndex].trim(), 10) : 4;
                    const explanationVal = explanationIndex !== -1 && row[explanationIndex] ? row[explanationIndex].trim() : '';
                    const subjectVal = subjectIndex !== -1 && row[subjectIndex] ? row[subjectIndex].trim() : '';
                    const topicVal = topicIndex !== -1 && row[topicIndex] ? row[topicIndex].trim() : '';
                    const answerVal = answerIndex !== -1 && row[answerIndex] ? row[answerIndex].trim() : '';

                    const options = [];
                    optionHeaderMappings.forEach((mapping) => {
                        const optVal = row[mapping.index];
                        if (optVal !== undefined && optVal !== null && optVal.trim() !== '') {
                            options.push(optVal.trim());
                        }
                    });

                    questionsToImport.push({
                        text: textVal,
                        type: typeVal,
                        difficulty: difficultyVal,
                        marks: isNaN(marksVal) ? 4 : marksVal,
                        explanation: explanationVal,
                        subject: subjectVal,
                        topic: topicVal,
                        options: typeVal === 'mcq' ? options : undefined,
                        correctAnswer: answerVal
                    });
                }

                if (questionsToImport.length === 0) {
                    throw new Error("No valid questions found to import.");
                }

                toast({ title: "Importing...", description: `Sending ${questionsToImport.length} questions to server...` });

                const res = await fetch('/api/questions/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questions: questionsToImport })
                });

                const data = await res.json();
                if (data.success) {
                    if (data.failedCount === 0) {
                        toast({
                            title: "Import Successful",
                            description: `Successfully imported all ${data.importedCount} questions.`
                        });
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Import Partially Completed",
                            description: `Successfully imported ${data.importedCount} questions. ${data.failedCount} failed. Please verify console for errors.`
                        });
                        console.warn("Bulk import errors:", data.errors);
                    }
                    fetchQuestions();
                } else {
                    throw new Error(data.error || "Server rejected the bulk import.");
                }

            } catch (err) {
                console.error("Bulk import failed:", err);
                toast({
                    variant: "destructive",
                    title: "Import Failed",
                    description: err.message || "Invalid CSV format or network issue."
                });
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    // AI Generation
    const handleGenerateAI = async () => {
        if (!aiConfig.topic || !aiConfig.subjectId) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please select a subject and enter a topic." });
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiConfig)
            });

            const data = await res.json();

            if (data.success) {
                toast({ title: "Success", description: `Generated ${data.count} questions successfully!` });
                setIsAIDialogOpen(false);
                fetchQuestions();
            } else {
                throw new Error(data.error || "Failed");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Generation Failed", description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };


    useEffect(() => {
        fetchQuestions();
        fetchSubjects();
    }, []);

    const handleQuestionAdded = () => {
        setIsFormOpen(false);
        setEditingQuestion(null);
        fetchQuestions();
    };

    return (
        <div className="flex h-full bg-background dark:bg-background-dark text-foreground">
            {/* Page Specific Sidebar */}
            <aside className="w-64 border-r border-border bg-card dark:bg-surface-dark flex flex-col pt-4 hidden lg:flex shrink-0">
                <div className="px-6 py-4 flex flex-col gap-1">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 ml-2">Question Management</h3>
                    <NavButton
                        icon={FileQuestion}
                        label="Question Bank"
                        active
                        onClick={() => fetchQuestions()}
                    />
                    <NavButton
                        icon={BrainCircuit}
                        label="AI Generator"
                        onClick={() => setIsAIDialogOpen(true)}
                    />

                </div>

                <div className="mt-8 px-6">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 ml-2">Quick Actions</h3>
                    {/* ... previously modified section ... */}
                    <div className="flex flex-col gap-3">
                        <Button
                            className="w-full justify-start gap-2 bg-primary hover:bg-blue-600 font-bold h-11"
                            onClick={() => setIsFormOpen(true)}
                        >
                            <Plus className="size-4" /> Add Single Question
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 border-border h-11 font-bold"
                            onClick={handleImportClick}
                        >
                            <Upload className="size-4" /> Bulk Import (CSV)
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 border-border h-11 font-bold"
                            onClick={handleExport}
                        >
                            <Download className="size-4" /> Export Bank
                        </Button>
                    </div>
                </div>

                {/* Stats in Sidebar */}
                <div className="mt-auto p-6 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-2">Status Overview</h3>
                    <div className="grid gap-3">
                        {stats.map(stat => (
                            <div key={stat.label} className="bg-muted/30 p-3 rounded-xl border border-border">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-sm font-black">{stat.value}</p>
                                    <span className={cn("text-[8px] font-bold", stat.trendUp ? "text-emerald-500" : "text-muted-foreground")}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
                <header className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border bg-card/30 backdrop-blur-sm">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Question Bank</h1>
                        <p className="text-muted-foreground">Manage, review and categorize your platform's total question repository.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="size-11 p-0 border-border bg-card">
                            <Filter className="size-5" />
                        </Button>
                        <Button
                            className="bg-primary hover:bg-blue-600 text-white font-bold h-11 px-6 shadow-lg shadow-primary/20"
                            onClick={() => setIsFormOpen(true)}
                        >
                            New Question
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {/* Search Bar */}
                    <div className="relative group max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5 transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Search questions by text, topic or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 pl-12 rounded-2xl bg-card border-border shadow-sm text-lg focus:ring-4 ring-primary/10 transition-all font-medium"
                        />
                    </div>

                    {/* Question List */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 className="size-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading questions...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-6 bg-muted/30 rounded-full mb-6">
                                <FileQuestion className="size-16 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No questions yet</h3>
                            <p className="text-muted-foreground max-w-md mb-6">
                                Start building your question bank by adding individual questions or importing them in bulk.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    className="gap-2 bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-primary/20"
                                    onClick={() => setIsFormOpen(true)}
                                >
                                    <Plus className="size-5" />
                                    Add First Question
                                </Button>
                                <Button variant="outline" className="gap-2 border-border font-bold">
                                    <Upload className="size-5" />
                                    Bulk Import
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {/* Selection Toolbar */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className={cn(
                                            "size-5 rounded-md border flex items-center justify-center transition-all",
                                            selectedQuestionIds.length === questions.length && questions.length > 0
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-background"
                                        )}
                                    >
                                        {selectedQuestionIds.length === questions.length && questions.length > 0 && (
                                            <Check className="size-3.5 stroke-[3]" />
                                        )}
                                    </button>
                                    <span className="text-sm font-semibold text-foreground">
                                        Select All Questions on this Page ({questions.length})
                                    </span>
                                </div>
                                {selectedQuestionIds.length > 0 && (
                                    <span className="text-xs text-muted-foreground font-bold">
                                        {selectedQuestionIds.length} of {questions.length} selected
                                    </span>
                                )}
                            </div>

                            {questions
                                .filter(q =>
                                    !searchQuery ||
                                    q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (q.topic?.name && q.topic.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                )
                                .map((q, i) => (
                                    <motion.div
                                        key={q.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => handleEdit(q)}
                                        className="flex flex-row items-start gap-4 p-6 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelectQuestion(q.id);
                                            }}
                                            className={cn(
                                                "size-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-1.5",
                                                selectedQuestionIds.includes(q.id)
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-background"
                                            )}
                                        >
                                            {selectedQuestionIds.includes(q.id) && (
                                                <Check className="size-3.5 stroke-[3]" />
                                            )}
                                        </button>

                                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
                                                        {q.topic?.subject?.name || 'Subject'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] font-medium border-border">
                                                        {q.topic?.name || 'Topic'}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground font-medium">• {q.type}</span>
                                                </div>
                                                <p className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors pr-8 line-clamp-2">
                                                    {q.text}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                                                    <span className={cn(
                                                        "flex items-center gap-1",
                                                        q.difficulty === 'hard' ? "text-red-500" : q.difficulty === 'medium' ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : 'Medium'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <div className={cn(
                                                            "size-1.5 rounded-full",
                                                            q.isActive === false ? "bg-amber-500" : "bg-emerald-500"
                                                        )} />
                                                        {q.isActive === false ? "Inactive" : "Published"}
                                                    </span>
                                                    {q.marks && (
                                                        <span className="flex items-center gap-1">
                                                            • {q.marks} Marks
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 md:mt-0" onClick={(e) => e.stopPropagation()}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                    onClick={() => handleEdit(q)}
                                                >
                                                    <Edit className="size-5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                    onClick={() => handleDelete(q)}
                                                >
                                                    <Trash2 className="size-5" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon" className="rounded-xl border-border">
                                                            <MoreVertical className="size-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl rounded-xl p-1">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDuplicate(q)} 
                                                            className="rounded-lg gap-2 cursor-pointer p-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all"
                                                        >
                                                            <Copy className="size-4" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleToggleActive(q)} 
                                                            className="rounded-lg gap-2 cursor-pointer p-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all"
                                                        >
                                                            {q.isActive === false ? (
                                                                <>
                                                                    <CheckCircle2 className="size-4 text-emerald-500" /> Activate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="size-4 text-amber-500" /> Deactivate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleCopyId(q.id)} 
                                                            className="rounded-lg gap-2 cursor-pointer p-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all"
                                                        >
                                                            <FileQuestion className="size-4" /> Copy ID
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(q)} 
                                                            className="rounded-lg gap-2 cursor-pointer p-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        >
                                                            <Trash2 className="size-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {questions.length > 0 && (
                        <div className="flex items-center justify-between pt-8 border-t border-border">
                            <p className="text-sm text-muted-foreground font-medium">
                                Showing <span className="text-foreground font-bold">1-{questions.length}</span> of {stats[0].value} questions
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" className="rounded-xl gap-2 h-10 border-border font-bold" disabled>
                                    <ChevronLeft className="size-4" /> Previous
                                </Button>
                                <Button variant="outline" className="rounded-xl gap-2 h-10 border-border font-bold" disabled>
                                    Next <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                        <DialogDescription>
                            {editingQuestion ? 'Modify the question details below.' : 'Fill in the details below to add a new question to the bank.'}
                        </DialogDescription>
                    </DialogHeader>
                    <QuestionForm
                        initialData={editingQuestion}
                        onSuccess={handleQuestionAdded}
                        onCancel={() => {
                            setIsFormOpen(false);
                            setEditingQuestion(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* AI Generator Dialog */}
            <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BrainCircuit className="size-5 text-primary" />
                            AI Question Generator
                        </DialogTitle>
                        <DialogDescription>
                            Automatically generate multiple-choice questions using AI.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select
                                value={aiConfig.subjectId}
                                onValueChange={(val) => setAiConfig({ ...aiConfig, subjectId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                    {subjects.length === 0 && <div className="p-2 text-xs text-muted-foreground">No subjects found</div>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Topic</Label>
                            <Input
                                placeholder="e.g. Newton's Laws of Motion"
                                value={aiConfig.topic}
                                onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select
                                    value={aiConfig.difficulty}
                                    onValueChange={(val) => setAiConfig({ ...aiConfig, difficulty: val })}
                                >
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
                                <Label>Count: {aiConfig.count}</Label>
                                <Slider
                                    value={[aiConfig.count]}
                                    min={1}
                                    max={10}
                                    step={1}
                                    onValueChange={(vals) => setAiConfig({ ...aiConfig, count: vals[0] })}
                                    className="py-1"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerateAI} disabled={isGenerating} className="bg-primary hover:bg-blue-600 gap-2">
                            {isGenerating ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="size-4" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => {
                setIsDeleteOpen(open);
                if (!open) {
                    setQuestionToDelete(null);
                    setIsUsedInTests(false);
                }
            }}>
                <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                    <DialogHeader className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                            <AlertTriangle className="size-8" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            {isUsedInTests ? "Force Delete Question" : "Delete Question"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm max-w-xs">
                            {isUsedInTests 
                                ? "This question is currently used in active tests. Deleting it will automatically remove it from those tests."
                                : "Are you sure you want to permanently delete this question? This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    {questionToDelete && (
                        <div className="my-2 p-4 rounded-xl bg-muted/35 border border-border/40">
                            <p className="text-sm font-semibold text-foreground leading-relaxed line-clamp-4 italic">
                                "{questionToDelete.text}"
                            </p>
                        </div>
                    )}
                    {isUsedInTests && (
                        <div className="text-[11px] text-red-500 font-bold text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 my-1">
                            Warning: Removing this question from existing tests will alter those tests.
                        </div>
                    )}
                    <div className="flex gap-3 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsDeleteOpen(false);
                                setQuestionToDelete(null);
                                setIsUsedInTests(false);
                            }}
                            className="flex-1 rounded-xl h-11 border-border font-bold text-sm"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => confirmDelete(isUsedInTests)}
                            className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm gap-2"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4" />
                                    {isUsedInTests ? "Force Delete" : "Yes, Delete"}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Dialog */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={(open) => {
                setIsBulkDeleteOpen(open);
                if (!open) {
                    setIsBulkUsedInTests(false);
                }
            }}>
                <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                    <DialogHeader className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                            <AlertTriangle className="size-8" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            {isBulkUsedInTests ? "Force Bulk Delete Questions" : "Delete Selected Questions"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm max-w-xs">
                            {isBulkUsedInTests 
                                ? "Some of the selected questions are currently used in active tests. Force deleting will automatically remove them from those tests."
                                : `Are you sure you want to permanently delete these ${selectedQuestionIds.length} question(s)? This action cannot be undone.`}
                        </DialogDescription>
                    </DialogHeader>
                    {isBulkUsedInTests && (
                        <div className="text-[11px] text-red-500 font-bold text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 my-1">
                            Warning: Removing these questions from existing tests will alter those tests.
                        </div>
                    )}
                    <div className="flex gap-3 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsBulkDeleteOpen(false);
                                setIsBulkUsedInTests(false);
                            }}
                            className="flex-1 rounded-xl h-11 border-border font-bold text-sm"
                            disabled={isBulkDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => confirmBulkDelete(isBulkUsedInTests)}
                            className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm gap-2"
                            disabled={isBulkDeleting}
                        >
                            {isBulkDeleting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4" />
                                    {isBulkUsedInTests ? "Force Delete All" : "Yes, Delete"}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Selection Floating Actions Bar */}
            {selectedQuestionIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <span className="text-sm font-bold text-foreground shrink-0">
                        {selectedQuestionIds.length} question{selectedQuestionIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuestionIds([])}
                            className="rounded-xl border-border font-bold text-xs h-9 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setIsBulkUsedInTests(false);
                                setIsBulkDeleteOpen(true);
                            }}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 h-9 px-4 shadow-lg shadow-red-600/10"
                        >
                            <Trash2 className="size-3.5" /> Delete Selected
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavButton({ icon: Icon, label, active = false, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon className="size-5" />
            {label}
        </button>
    );
}
