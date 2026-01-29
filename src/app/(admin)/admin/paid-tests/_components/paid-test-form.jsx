'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Plus, X, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// ----------------------------------------------------------------------
// CONFIGURATION & SCHEMA - PAID TEST SPECIFIC
// ----------------------------------------------------------------------

const CLASS_OPTIONS = ['9', '10', '11', '12'];

const CLASS_SUBJECTS = {
    '9': ['Mathematics', 'Science'],
    '10': ['Mathematics', 'Science'],
    '11': ['Physics', 'Chemistry', 'Mathematics', 'Astronomy'],
    '12': ['Physics', 'Chemistry', 'Mathematics', 'Astronomy'],
};

const DEFAULT_SUBJECTS = ['Mathematics', 'Science'];

const paidTestFormSchema = z.object({
    title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
    description: z.string().optional(),
    class: z.string({ required_error: 'Please select a class.' }),
    subject: z.string({ required_error: 'Please select a subject.' }),
    testType: z.enum(['weekly', 'practice', 'olympiad', 'mock', 'custom'], {
        required_error: 'Please select a test type.',
    }),
    topic: z.string().optional(),
    duration: z.coerce.number().min(1, { message: 'Duration must be at least 1 minute.' }),

    // Scheduling
    isScheduled: z.boolean().default(false),
    startTime: z.date().optional(),
    endTime: z.date().optional(),

    // Settings
    isPublished: z.boolean().default(false),

    // Paid Test Specifics - Enforced
    isPaid: z.literal(true),
    price: z.coerce.number().min(1, { message: 'Price must be greater than 0' }),

    passingScore: z.coerce.number().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().min(0).optional(),
    instructions: z.string().optional(),
    tags: z.array(z.string()).default([]),
});

export function PaidTestForm({ test, onSuccess }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [newTag, setNewTag] = useState('');

    const form = useForm({
        resolver: zodResolver(paidTestFormSchema),
        defaultValues: {
            title: test?.title || '',
            description: test?.description || '',
            class: test?.class || '',
            subject: test?.subject || '',
            testType: test?.testType || 'weekly',
            topic: test?.topic || '',
            duration: test?.duration || 60,
            isScheduled: test?.isScheduled ?? false,
            isPublished: test?.isPublished ?? true,
            // Enforce Paid defaults
            isPaid: true,
            price: test?.price || 0,

            passingScore: test?.passingScore || 40,
            maxAttempts: test?.maxAttempts ?? 1,
            instructions: test?.instructions || '',
            tags: test?.tags || [],
            startTime: test?.startTime,
            endTime: test?.endTime,
        },
    });

    const watchClass = form.watch('class');
    const watchIsScheduled = form.watch('isScheduled');
    const watchTestType = form.watch('testType');
    const watchStartTime = form.watch('startTime');
    const watchDuration = form.watch('duration');

    const availableSubjects = watchClass ? CLASS_SUBJECTS[watchClass] : DEFAULT_SUBJECTS;

    useEffect(() => {
        if (watchTestType === 'olympiad') {
            form.setValue('duration', 180);
            form.setValue('isScheduled', true);
        } else if (watchTestType === 'weekly') {
            form.setValue('duration', 60);
            form.setValue('isScheduled', true);
        } else if (watchTestType === 'practice') {
            form.setValue('duration', 30);
            form.setValue('isScheduled', false);
        }
    }, [watchTestType, form]);

    const addTag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
            const currentTags = form.getValues('tags');
            form.setValue('tags', [...currentTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        form.setValue('tags', form.getValues('tags').filter((tag) => tag !== tagToRemove));
    };

    const onSubmit = async (data) => {
        try {
            setIsLoading(true);

            const { isScheduled, duration, maxAttempts, topic, ...rest } = data;

            const requestData = {
                ...rest,
                durationMinutes: duration,
                startTime: isScheduled && data.startTime ? data.startTime.toISOString() : null,
                endTime: isScheduled && data.startTime && duration
                    ? new Date(data.startTime.getTime() + duration * 60000).toISOString()
                    : null,
                allowMultipleAttempts: maxAttempts > 1,
                isPaid: true, // Always true for this form
                price: Number(data.price),
            };

            const url = test ? `/api/tests/${test.id}` : '/api/tests';
            const method = test ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save paid test');
            }

            toast({
                title: 'Success!',
                description: test ? 'Paid test updated successfully.' : 'Paid test created successfully.',
            });

            if (onSuccess) {
                onSuccess(result.data);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error('Error saving paid test:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save paid test.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">

                {/* PRICE CONFIGURATION (Detailed for Paid Tests) */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <IndianRupee className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Pricing Configuration</h3>
                            <p className="text-xs text-muted-foreground">Set the price for this paid test.</p>
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price (INR)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input type="number" placeholder="Enter amount (e.g. 499)" className="pl-9 font-bold" {...field} />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    This is the final amount students will pay.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* DETAILS */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Test Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Premium Math Olympiad Mock #1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="class"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Class" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CLASS_OPTIONS.map((c) => (
                                                <SelectItem key={c} value={c}>Class {c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchClass}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={watchClass ? "Select Subject" : "Select Class first"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableSubjects?.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="topic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Topic (Chapters)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Rotational Motion" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Short description..." className="resize-none h-10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* CONFIGURATION */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border">
                        <FormField
                            control={form.control}
                            name="testType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly Test</SelectItem>
                                            <SelectItem value="practice">Practice Test</SelectItem>
                                            <SelectItem value="olympiad">Olympiad</SelectItem>
                                            <SelectItem value="mock">Mock Test</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration (mins)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="passingScore"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Passing %</FormLabel>
                                    <FormControl>
                                        <Input type="number" max="100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="maxAttempts"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attempts Allowed</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0 for unlimited" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isPublished"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                                    <div className="space-y-0.5">
                                        <FormLabel>Published</FormLabel>
                                        <FormDescription>Visible to students</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* SCHEDULING */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold tracking-tight">Scheduling</h3>
                        <FormField
                            control={form.control}
                            name="isScheduled"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormLabel className="font-normal text-muted-foreground mr-2">Enable Schedule</FormLabel>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {watchIsScheduled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border animate-in fade-in slide-in-from-top-2">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date & Time</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t border-border">
                                                    <Input
                                                        type="time"
                                                        value={field.value ? format(field.value, 'HH:mm') : ''}
                                                        onChange={(e) => {
                                                            const [h, m] = e.target.value.split(':');
                                                            const d = field.value || new Date();
                                                            d.setHours(Number(h));
                                                            d.setMinutes(Number(m));
                                                            field.onChange(d);
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col justify-end pb-2">
                                <div className="text-sm text-muted-foreground bg-card p-3 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-semibold">Calculated End Time:</span>
                                    </div>
                                    {watchStartTime ? (
                                        <span className="text-foreground font-mono">
                                            {format(new Date(watchStartTime.getTime() + (watchDuration * 60000)), 'PPP HH:mm')}
                                        </span>
                                    ) : (
                                        <span>--</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* TAGS */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Tags</h3>
                    <div className="bg-muted/10 p-6 rounded-xl border border-border">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {form.watch('tags')?.map((tag) => (
                                <div key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 hover:text-red-500">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {form.watch('tags')?.length === 0 && <span className="text-sm text-muted-foreground italic">No tags added yet.</span>}
                        </div>
                        <div className="flex gap-2 max-w-sm">
                            <Input
                                placeholder="Add tag..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag(e);
                                    }
                                }}
                            />
                            <Button type="button" variant="secondary" onClick={addTag} size="sm"><Plus className="size-4" /></Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Instructions</h3>
                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter test instructions..."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-8 border-t">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            if (onSuccess) onSuccess();
                            else router.back();
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="min-w-[150px] font-bold bg-emerald-500 hover:bg-emerald-600 text-black">
                        {isLoading ? 'Saving...' : (test ? 'Update Paid Test' : 'Create Paid Test')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
