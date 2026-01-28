
'use client';

import { useState, useEffect } from 'react';
import {
    Trophy,
    Plus,
    Calendar,
    MoreVertical,
    Trash2,
    FileText,
    AlertCircle,
    Megaphone,
    Loader2,
    Paperclip,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OlympiadUpdatesPage() {
    const [updates, setUpdates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDiaologOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'UPDATE', // UPDATE, NOTICE, RESULT
        olympiadId: '',
        documentUrl: '',
    });

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/olympiads/updates');
            if (!res.ok) throw new Error('Failed to fetch updates');
            const data = await res.json();
            setUpdates(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load updates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            toast.error('Title is required');
            return;
        }

        try {
            setIsSubmitting(true);

            let uploadedUrl = '';
            if (file) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                uploadFormData.append('type', 'documents');

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json().catch(() => ({}));
                    throw new Error(errorData.error || 'File upload failed');
                }
                const uploadData = await uploadRes.json();
                uploadedUrl = uploadData.url;
            }

            const payload = {
                ...formData,
                documentUrl: uploadedUrl || formData.documentUrl
            };

            const res = await fetch('/api/admin/olympiads/updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to create update');

            toast.success('Update published successfully');
            setIsDialogOpen(false);
            setFormData({ title: '', content: '', type: 'UPDATE', olympiadId: '', documentUrl: '' });
            setFile(null);
            fetchUpdates();
        } catch (error) {
            console.error(error);
            toast.error('Failed to publish update');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`/api/admin/olympiads/updates/${deleteId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Update deleted');
            setUpdates(updates.filter(u => u.id !== deleteId));
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete update');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'NOTICE': return <AlertCircle className="h-4 w-4 text-amber-500" />;
            case 'RESULT': return <Trophy className="h-4 w-4 text-emerald-500" />;
            default: return <Megaphone className="h-4 w-4 text-blue-500" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'NOTICE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'RESULT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground mb-1">Olympiad Updates</h2>
                    <p className="text-muted-foreground">Manage announcements, notices, and result updates.</p>
                </div>

                <Dialog open={isDiaologOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-5 w-5" />
                            New Update
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-card border-border">
                        <DialogHeader>
                            <DialogTitle>Publish New Update</DialogTitle>
                            <DialogDescription>
                                Post a new announcement or result update for olympiad students.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Update Type</label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UPDATE">General Update</SelectItem>
                                        <SelectItem value="NOTICE">Important Notice</SelectItem>
                                        <SelectItem value="RESULT">Result Announcement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    placeholder="e.g., Mathematics Olympiad Results Declared"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Content</label>
                                <Textarea
                                    placeholder="Enter the detailed content of the update (optional)..."
                                    className="min-h-[150px]"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Document (Optional)</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="cursor-pointer"
                                    />
                                    {/* Helper text or icon could go here */}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Publish
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-500">
                                <AlertCircle className="h-5 w-5" />
                                Delete Update
                            </DialogTitle>
                            <DialogDescription className="py-2">
                                Are you sure you want to delete this update? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : updates.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border rounded-xl bg-muted/50">
                        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">No updates published</h3>
                        <p className="text-muted-foreground">Click the button above to publish your first update.</p>
                    </div>
                ) : (
                    updates.map((update) => (
                        <Card key={update.id} className="overflow-hidden border-border bg-card transition-all hover:shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={`gap-1.5 font-bold ${getTypeColor(update.type)}`}>
                                                {getTypeIcon(update.type)}
                                                {update.type}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(update.date), 'MMMM d, yyyy')}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-foreground mb-2">{update.title}</h3>
                                            <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed mb-3">
                                                {update.content}
                                            </p>

                                            {update.documentUrl && (
                                                <a
                                                    href={update.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 transition-colors hover:bg-primary/10"
                                                >
                                                    <Paperclip className="h-4 w-4" />
                                                    View Attached Document
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(update.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div >
    );
}
