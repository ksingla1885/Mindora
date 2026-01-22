'use client';

import { useState, useEffect } from 'react';
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
    Loader2
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
import QuestionForm from './_components/question-form';
import { toast } from '@/components/ui/use-toast';

export default function QuestionManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [stats, setStats] = useState([
        { label: 'Total Questions', value: '0', trend: 'No questions', trendUp: null, icon: FileQuestion },
        { label: 'Unreviewed', value: '0', trend: 'No pending', trendUp: null, icon: Clock }
    ]);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/questions');
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

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleQuestionAdded = () => {
        setIsFormOpen(false);
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
                        onClick={() => toast({ title: "AI Generator", description: "AI Question Generation module is currently initializing." })}
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
                            onClick={() => toast({ title: "Coming Soon", description: "Bulk import via Excel will be available in the next update." })}
                        >
                            <Upload className="size-4" /> Bulk Import (Excel)
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 border-border h-11 font-bold"
                            onClick={() => toast({ title: "Export Started", description: "Your question bank is being exported to CSV." })}
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
                                        className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                                    >
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
                                                    <div className="size-1.5 rounded-full bg-emerald-500" />
                                                    Published
                                                </span>
                                                {q.marks && (
                                                    <span className="flex items-center gap-1">
                                                        • {q.marks} Marks
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                <Edit className="size-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">
                                                <Trash2 className="size-5" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="rounded-xl border-border">
                                                <MoreVertical className="size-5" />
                                            </Button>
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
                        <DialogTitle>Add New Question</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new question to the bank.
                        </DialogDescription>
                    </DialogHeader>
                    <QuestionForm
                        onSuccess={handleQuestionAdded}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
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
