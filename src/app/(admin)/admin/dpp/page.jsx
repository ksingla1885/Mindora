
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText,
    Plus,
    Calendar,
    BookOpen,
    MoreVertical,
    Trash2,
    Loader2,
    Filter,
    Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function DPPPage() {
    const [dpps, setDpps] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [classFilter, setClassFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');

    useEffect(() => {
        fetchSubjects();
        fetchDPPs();
    }, [classFilter, subjectFilter]);

    const fetchSubjects = async () => {
        try {
            const params = new URLSearchParams();
            if (classFilter && classFilter !== 'all') {
                params.append('class', classFilter);
            }
            const res = await fetch(`/api/admin/subjects?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchDPPs = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (classFilter !== 'all') params.append('class', classFilter);
            if (subjectFilter !== 'all') params.append('subjectId', subjectFilter);

            const res = await fetch(`/api/admin/dpp?${params}`);
            if (!res.ok) throw new Error('Failed to fetch DPPs');

            const data = await res.json();
            setDpps(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load DPPs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this DPP? This will delete all associated questions.')) return;

        try {
            const res = await fetch(`/api/admin/dpp/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('DPP deleted');
            setDpps(dpps.filter(d => d.id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete DPP');
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground mb-1">Daily Practice Problems</h2>
                    <p className="text-muted-foreground">Manage daily question sets for students.</p>
                </div>

                <Link href="/admin/dpp/create">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-5 w-5" />
                        Create New DPP
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    Filters:
                </div>

                <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="9">Class 9</SelectItem>
                        <SelectItem value="10">Class 10</SelectItem>
                        <SelectItem value="11">Class 11</SelectItem>
                        <SelectItem value="12">Class 12</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : dpps.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border rounded-xl bg-muted/50">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">No DPPs found</h3>
                        <p className="text-muted-foreground">Create a new daily practice problem set to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dpps.map((dpp) => (
                            <Card key={dpp.id} className="group hover:border-primary/50 transition-all cursor-pointer">
                                <CardContent className="p-6 flex flex-col h-full gap-4">
                                    <div className="flex items-start justify-between">
                                        <Badge variant="outline" className="font-bold">
                                            Class {dpp.class}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/admin/dpp/create?id=${dpp.id}`}>
                                                    <DropdownMenuItem>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(dpp.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{dpp.title || 'Untitled DPP'}</h3>
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{dpp.subject?.name || 'Unknown Subject'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {format(new Date(dpp.date), 'MMM d, yyyy')}
                                        </div>
                                        <div>
                                            {dpp._count?.questions || 0} Questions
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
