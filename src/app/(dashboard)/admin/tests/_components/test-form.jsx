'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Plus, X, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Form schema for validation
const testFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  description: z.string().optional(),
  testType: z.enum(['weekly', 'practice', 'olympiad', 'mock', 'custom'], {
    required_error: 'Please select a test type.',
  }),
  subject: z.string().min(1, {
    message: 'Please select a subject.',
  }),
  topic: z.string().optional(),
  duration: z.coerce.number().min(1, {
    message: 'Duration must be at least 1 minute.',
  }),
  isScheduled: z.boolean().default(false),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  isPublished: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  price: z.coerce.number().min(0).optional(),
  passingScore: z.coerce.number().min(0).optional(),
  maxAttempts: z.coerce.number().min(0).optional(),
  instructions: z.string().optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

// Mock subjects - replace with API call
const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'History', 'Geography', 'Computer Science', 'Economics', 'General Knowledge'
];

// Mock categories - replace with API call
const availableCategories = [
  'JEE Main', 'NEET', 'JEE Advanced', 'Foundation', 'Olympiad',
  'School Level', 'Competitive Exams', 'Practice Tests'
];

export function TestForm({ test, onSuccess }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const form = useForm({
    resolver: zodResolver(testFormSchema),
    defaultValues: test || {
      title: '',
      description: '',
      testType: 'weekly',
      subject: '',
      topic: '',
      duration: 60,
      isScheduled: false,
      isPublished: false,
      isPaid: false,
      instructions: '',
      categories: [],
      tags: [],
    },
  });

  const watchIsScheduled = form.watch('isScheduled');
  const watchIsPaid = form.watch('isPaid');
  const watchTestType = form.watch('testType');

  // Set default values based on test type
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
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    form.setValue(
      'tags',
      form.getValues('tags').filter((tag) => tag !== tagToRemove)
    );
  };

  const toggleCategory = (category) => {
    const currentCategories = form.getValues('categories');
    if (currentCategories.includes(category)) {
      form.setValue(
        'categories',
        currentCategories.filter((c) => c !== category)
      );
    } else {
      form.setValue('categories', [...currentCategories, category]);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Prepare the data to send
      const testData = {
        ...data,
        // Convert dates to ISO string if they exist
        startTime: data.isScheduled && data.startTime ? data.startTime.toISOString() : null,
        endTime: data.isScheduled && data.startTime && data.duration 
          ? new Date(data.startTime.getTime() + data.duration * 60000).toISOString()
          : null,
        // Remove price if not a paid test
        price: data.isPaid ? data.price : 0,
      };

      // TODO: Replace with actual API call
      console.log('Submitting test:', testData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success!',
        description: test ? 'Test updated successfully.' : 'Test created successfully.',
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/tests');
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekly Physics Test - Mechanics" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear and descriptive title for the test.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a brief description of the test..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="testType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a test type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly Test</SelectItem>
                        <SelectItem value="practice">Practice Test</SelectItem>
                        <SelectItem value="olympiad">Olympiad</SelectItem>
                        <SelectItem value="mock">Mock Test</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
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
                    <FormLabel>Topic (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mechanics, Organic Chemistry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Scheduling</h3>
            
            <FormField
              control={form.control}
              name="isScheduled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Scheduled Test</FormLabel>
                    <FormDescription>
                      {field.value 
                        ? 'Test will be available only during the specified time period.'
                        : 'Test will be available anytime after publishing.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchIsScheduled && (
              <>
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP HH:mm")
                              ) : (
                                <span>Pick a date and time</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                          <div className="p-3 border-t border-border">
                            <Input
                              type="time"
                              value={field.value ? format(field.value, 'HH:mm') : ''}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const newDate = field.value || new Date();
                                newDate.setHours(parseInt(hours, 10));
                                newDate.setMinutes(parseInt(minutes, 10));
                                field.onChange(newDate);
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Test will end at: </span>
                    {form.watch('startTime') && form.watch('duration') ? (
                      <span className="font-medium">
                        {format(
                          new Date(
                            form.watch('startTime').getTime() + 
                            (form.watch('duration') * 60000)
                          ), 
                          'PPP HH:mm'
                        )}
                      </span>
                    ) : (
                      <span>Not specified</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Categories & Tags */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Categories & Tags</h3>
            
            <div>
              <FormLabel>Categories</FormLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={form.watch('categories')?.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <label
                      htmlFor={`cat-${category}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <FormLabel>Tags</FormLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.watch('tags')?.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  className="ml-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Test Settings</h3>
            
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish Test</FormLabel>
                    <FormDescription>
                      {field.value 
                        ? 'This test is visible to users.'
                        : 'This test is not visible to users yet.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Paid Test</FormLabel>
                    <FormDescription>
                      {field.value 
                        ? 'Users need to pay to take this test.'
                        : 'This test is free for all users.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchIsPaid && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="passingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Score (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="e.g., 40" 
                      {...field} 
                    />
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
                  <FormLabel>Max Attempts</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="0 for unlimited attempts" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter test instructions that will be shown to students before they start the test..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can use markdown to format the instructions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push('/admin/tests')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {test ? 'Updating...' : 'Creating...'}
              </span>
            ) : test ? 'Update Test' : 'Create Test'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
