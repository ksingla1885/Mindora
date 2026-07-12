'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Search, Folder, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { QuestionForm } from '@/components/admin/questions/QuestionForm';
import { Checkbox } from '@/components/ui/checkbox';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// AddQuestionsModal — built with createPortal for 100% layout control.
// No Radix Dialog involved, so no Tailwind class specificity conflicts.
// ─────────────────────────────────────────────────────────────────────────────
function AddQuestionsModal({
    isOpen,
    onClose,
    isFetchingAvailable,
    folderOptions,
    folderCounts,
    selectedFolder,
    setSelectedFolder,
    setSearchQuery,
    searchQuery,
    filteredAvailableQuestions,
    selectedQuestions,
    setSelectedQuestions,
    handleAddSelectedQuestions,
    handleCreateQuestion,
    isSaving,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        // Backdrop
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            {/* Modal panel */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '960px',
                    height: '85vh',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted-foreground))',
                        transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid hsl(var(--border))',
                }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Add Questions to Test
                    </h2>
                </div>

                {/* Tabs */}
                <Tabs
                    defaultValue="bank"
                    style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}
                >
                    {/* Tab switcher */}
                    <div style={{ flexShrink: 0, padding: '12px 24px 0' }}>
                        <TabsList className="grid grid-cols-2 max-w-xs">
                            <TabsTrigger value="bank">From Question Bank</TabsTrigger>
                            <TabsTrigger value="create">Create New</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Create tab */}
                    <TabsContent
                        value="create"
                        style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}
                    >
                        <QuestionForm onSubmit={handleCreateQuestion} onSuccess={onClose} isSubmitting={isSaving} />
                    </TabsContent>

                    {/* Bank tab */}
                    <TabsContent
                        value="bank"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            minHeight: 0,
                            overflow: 'hidden',
                            borderTop: '1px solid hsl(var(--border))',
                            marginTop: 0,
                        }}
                    >
                        {/* Two-panel body */}
                        <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>

                            {/* ── Left: Folder sidebar ── */}
                            <div style={{
                                width: '220px',
                                flexShrink: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                borderRight: '1px solid hsl(var(--border))',
                                backgroundColor: 'hsl(var(--muted)/0.2)',
                            }}>
                                <div style={{ flexShrink: 0, padding: '16px 12px 8px' }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        color: 'hsl(var(--muted-foreground))',
                                        padding: '0 8px',
                                    }}>Folders</p>
                                </div>
                                <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', padding: '0 8px 16px' }}>
                                    {isFetchingAvailable ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        folderOptions.map((folder) => {
                                            const count = folderCounts[folder] ?? 0;
                                            const isActive = selectedFolder === folder;
                                            return (
                                                <button
                                                    key={folder}
                                                    type="button"
                                                    onClick={() => { setSelectedFolder(folder); setSearchQuery(''); }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        width: '100%',
                                                        padding: '7px 12px',
                                                        marginBottom: '2px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        transition: 'background-color 0.15s',
                                                        backgroundColor: isActive ? '#2b6cee' : 'transparent',
                                                        color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                                                    }}
                                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'hsl(var(--muted)/0.6)'; }}
                                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                >
                                                    <Folder size={13} style={{ flexShrink: 0, color: isActive ? '#fff' : '#2b6cee' }} />
                                                    <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {folder === 'All' ? 'All Folders' : folder}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        padding: '2px 6px',
                                                        borderRadius: '6px',
                                                        flexShrink: 0,
                                                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'hsl(var(--muted))',
                                                        color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                                                    }}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* ── Right: Questions panel ── */}
                            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                                {/* Search bar */}
                                <div style={{ flexShrink: 0, padding: '12px 16px 8px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                        <Input
                                            placeholder="Search by question text or topic..."
                                            style={{ paddingLeft: '32px', height: '36px' }}
                                            className="bg-muted/50"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Sub-header */}
                                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 16px 6px' }}>
                                    <Folder size={13} style={{ color: '#2b6cee' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>
                                        {selectedFolder === 'All' ? 'All Folders' : selectedFolder}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                                        · {filteredAvailableQuestions.length} question{filteredAvailableQuestions.length !== 1 ? 's' : ''}
                                    </span>
                                    {selectedQuestions.length > 0 && (
                                        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#2b6cee' }}>
                                            {selectedQuestions.length} selected
                                        </span>
                                    )}
                                </div>

                                {/* Scrollable table */}
                                <div style={{
                                    flexGrow: 1,
                                    minHeight: 0,
                                    overflowY: 'auto',
                                    borderTop: '1px solid hsl(var(--border))',
                                }}>
                                    {isFetchingAvailable ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <TableHeader className="sticky top-0 bg-background z-10">
                                                <TableRow className="border-none hover:bg-transparent">
                                                    <TableHead style={{ width: '44px' }}></TableHead>
                                                    <TableHead>Question</TableHead>
                                                    <TableHead style={{ width: '120px' }}>Topic</TableHead>
                                                    <TableHead style={{ width: '72px' }}>Type</TableHead>
                                                    <TableHead style={{ width: '72px' }}>Marks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAvailableQuestions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <Folder className="size-10 text-muted-foreground/30" />
                                                                <p className="text-sm">No questions found in this folder.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredAvailableQuestions.map((q) => {
                                                        const isSelected = selectedQuestions.includes(q.id);
                                                        return (
                                                            <TableRow
                                                                key={q.id}
                                                                className={cn(
                                                                    'cursor-pointer transition-colors hover:bg-muted/50',
                                                                    isSelected && 'bg-primary/5 hover:bg-primary/10'
                                                                )}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedQuestions(prev => prev.filter(id => id !== q.id));
                                                                    } else {
                                                                        setSelectedQuestions(prev => [...prev, q.id]);
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell onClick={e => e.stopPropagation()}>
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) setSelectedQuestions(prev => [...prev, q.id]);
                                                                            else setSelectedQuestions(prev => prev.filter(id => id !== q.id));
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="max-w-[350px] py-3 pr-4">
                                                                    <div className="line-clamp-2 text-sm text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="text-[10px] bg-background/50">
                                                                        {q.topic?.name || 'N/A'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="secondary" className="text-[10px] capitalize">
                                                                        {q.type}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-semibold text-center">{q.marks}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </table>
                                    )}
                                </div>

                                {/* Footer */}
                                <div style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 24px',
                                    borderTop: '1px solid hsl(var(--border))',
                                    backgroundColor: 'hsl(var(--muted)/0.1)',
                                }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                                        {selectedQuestions.length > 0
                                            ? `${selectedQuestions.length} question${selectedQuestions.length !== 1 ? 's' : ''} selected`
                                            : 'Select questions to add to the test'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                                        <Button
                                            onClick={handleAddSelectedQuestions}
                                            disabled={selectedQuestions.length === 0 || isSaving}
                                            className="font-bold shadow-md gap-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                                                </>
                                            ) : (
                                                `Add Selected (${selectedQuestions.length})`
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmationModal — portal-based premium modal
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = true,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        {title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5' }}>
                        {message}
                    </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <Button variant="outline" onClick={onClose}>{cancelText}</Button>
                    <Button
                        variant={isDestructive ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="font-bold shadow-sm"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function TestQuestionsManager({ testId }) {
    const { toast } = useToast();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Add Questions State
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('All');
    const [isFetchingAvailable, setIsFetchingAvailable] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true,
    });

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
            toast({ title: 'Error', description: 'Failed to load test questions.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch questions for the modal
    const fetchAvailableQuestions = async () => {
        try {
            setIsFetchingAvailable(true);
            const res = await fetch('/api/questions?limit=1000&page=1');
            const data = await res.json();
            if (data.success) {
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
            setSelectedFolder('All');
        }
    }, [isAddModalOpen]);

    const handleCreateQuestion = async (formData) => {
        try {
            setIsSaving(true);
            const createRes = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || 'Failed to create question');

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
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSelectedQuestions = async () => {
        if (selectedQuestions.length === 0) return;
        try {
            setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveQuestion = (questionId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Question',
            message: 'Are you sure you want to remove this question from this test?',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/tests/${testId}/questions/${questionId}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to remove');
                    setQuestions(prev => prev.filter(q => q.question.id !== questionId));
                    toast({ title: 'Success', description: 'Question removed.' });
                } catch (error) {
                    toast({ title: 'Error', description: error.message || 'Failed to remove question.', variant: 'destructive' });
                }
            }
        });
    };

    const handleClearAllQuestions = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Clear All Questions',
            message: 'Are you sure you want to remove ALL questions from this test? This action cannot be undone.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/tests/${testId}/questions`, { method: 'DELETE' });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to clear questions');
                    setQuestions([]);
                    toast({ title: 'Success', description: 'All questions removed from test.' });
                } catch (error) {
                    toast({ title: 'Error', description: error.message || 'Failed to clear questions.', variant: 'destructive' });
                }
            }
        });
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
            setQuestions(prev => prev.map(q =>
                q.question.id === questionId ? { ...q, marks: parseInt(newMarks) } : q
            ));
            toast({ title: 'Success', description: 'Marks updated.' });
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to update marks.', variant: 'destructive' });
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        if (sourceIndex === destinationIndex) return;

        const items = Array.from(questions);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destinationIndex, 0, reorderedItem);
        setQuestions(items.map((item, index) => ({ ...item, sequence: index + 1 })));

        try {
            const res = await fetch(`/api/tests/${testId}/questions/${reorderedItem.questionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sequence: destinationIndex + 1 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reorder failed');
        } catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to save order.', variant: 'destructive' });
            fetchTestQuestions();
        }
    };

    // Derived folder data
    const activeFolderNames = [...new Set(
        availableQuestions.map(q => q.topic?.subject?.name || 'General')
    )].filter(Boolean).sort();
    const folderOptions = ['All', ...activeFolderNames];

    const folderCounts = folderOptions.reduce((acc, folder) => {
        acc[folder] = folder === 'All'
            ? availableQuestions.length
            : availableQuestions.filter(q => (q.topic?.subject?.name || 'General') === folder).length;
        return acc;
    }, {});

    const filteredAvailableQuestions = availableQuestions.filter(q => {
        const folderName = q.topic?.subject?.name || q.subject?.name || 'General';
        const matchesFolder = selectedFolder === 'All' || folderName === selectedFolder;
        const matchesSearch =
            q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.topic?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            folderName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">
                        Test Questions <span className="text-muted-foreground ml-2">({questions.length})</span>
                    </h3>
                    <Badge variant="outline" className="text-xs">
                        Total Marks: {questions.reduce((sum, q) => sum + (q.marks || 0), 0)}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    {questions.length > 0 && (
                        <Button
                            variant="destructive"
                            className="font-bold shadow-md"
                            onClick={handleClearAllQuestions}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Clear All
                        </Button>
                    )}
                    <Button
                        className="font-bold bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Questions
                    </Button>
                </div>
            </div>

            {/* Portal-based Add Questions modal */}
            <AddQuestionsModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                isFetchingAvailable={isFetchingAvailable}
                folderOptions={folderOptions}
                folderCounts={folderCounts}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredAvailableQuestions={filteredAvailableQuestions}
                selectedQuestions={selectedQuestions}
                setSelectedQuestions={setSelectedQuestions}
                handleAddSelectedQuestions={handleAddSelectedQuestions}
                handleCreateQuestion={handleCreateQuestion}
                isSaving={isSaving}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDestructive={confirmModal.isDestructive}
            />

            {/* Questions list */}
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
                        <p className="text-muted-foreground text-sm max-w-sm">
                            This test is currently empty. Click &quot;Add Questions&quot; to start building your test.
                        </p>
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
                                                        'grid grid-cols-[60px_1fr_100px_100px_100px_80px] p-4 items-center bg-card hover:bg-muted/5 transition-colors',
                                                        snapshot.isDragging && 'shadow-lg ring-1 ring-primary/20 bg-background z-50 rounded-lg'
                                                    )}
                                                >
                                                    <div
                                                        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                                        {...provided.dragHandleProps}
                                                    >
                                                        {index + 1}
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
