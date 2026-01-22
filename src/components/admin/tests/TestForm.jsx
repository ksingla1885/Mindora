'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Loader2, Plus, X } from 'lucide-react';

const testFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  testType: z.enum(['practice', 'timed', 'mock']),
  durationMinutes: z.number().int().positive('Duration must be positive'),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  isPaid: z.boolean().default(false),
  price: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  shuffleQuestions: z.boolean().default(false),
  showResults: z.boolean().default(true),
  passingScore: z.number().min(0).max(100).optional(),
  instructions: z.string().optional(),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  classes: z.array(z.string()).min(1, 'Select at least one class'),
  questionIds: z.array(z.string()).min(1, 'Select at least one question'),
});

export function TestForm({ test, onSubmit, isSubmitting = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const form = useForm({
    resolver: zodResolver(testFormSchema),
    defaultValues: test || {
      title: '',
      description: '',
      testType: 'practice',
      durationMinutes: 30,
      isPaid: false,
      price: 0,
      isActive: true,
      shuffleQuestions: false,
      showResults: true,
      passingScore: 50,
      instructions: '',
      subjects: [],
      classes: [],
      questionIds: [],
    },
  });

  const testType = form.watch('testType');
  const isPaid = form.watch('isPaid');

  // Load available questions based on filters
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams({
          search: searchQuery,
          subject: selectedSubject,
          class: selectedClass,
          limit: 50,
        }).toString();

        const response = await fetch(`/api/questions?${query}`);
        if (!response.ok) throw new Error('Failed to fetch questions');

        const data = await response.json();
        setAvailableQuestions(data.questions || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load questions. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [searchQuery, selectedSubject, selectedClass]);

  // Load test data if in edit mode
  useEffect(() => {
    if (test) {
      // Set form values from test prop
      form.reset({
        ...test,
        startTime: test.startTime ? new Date(test.startTime) : undefined,
        endTime: test.endTime ? new Date(test.endTime) : undefined,
      });
      setSelectedQuestions(test.questions || []);
    }
  }, [test, form]);

  const handleAddQuestion = (question) => {
    if (!selectedQuestions.some((q) => q.id === question.id)) {
      setSelectedQuestions([...selectedQuestions, question]);
      form.setValue('questionIds', [...form.getValues('questionIds'), question.id]);
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.id !== questionId));
    form.setValue(
      'questionIds',
      form.getValues('questionIds').filter((id) => id !== questionId)
    );
  };

  const handleSubmit = async (data) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      toast({
        title: 'Success',
        description: test ? 'Test updated successfully' : 'Test created successfully',
      });
      router.push('/admin/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save test',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test Details */}
          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter test title" {...field} value={field.value || ''} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter test description"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
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
                    <FormLabel>Test Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="practice">Practice Test</SelectItem>
                        <SelectItem value="timed">Timed Test</SelectItem>
                        <SelectItem value="mock">Mock Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {testType !== 'practice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select end time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is a paid test</FormLabel>
                      <FormDescription>
                        Enable if students need to purchase this test
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isPaid && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (INR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test Settings</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="shuffleQuestions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Shuffle Questions</FormLabel>
                        <FormDescription>
                          Questions will appear in random order for each student
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showResults"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Show Results</FormLabel>
                        <FormDescription>
                          Students can see their score and correct answers after submission
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter test instructions that students will see before starting the test"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Question Selection */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Questions ({selectedQuestions.length})</h3>

              {/* Search and filter */}
              <div className="space-y-2">
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      <SelectItem value="9">Class 9</SelectItem>
                      <SelectItem value="10">Class 10</SelectItem>
                      <SelectItem value="11">Class 11</SelectItem>
                      <SelectItem value="12">Class 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Available Questions */}
              <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : availableQuestions.length > 0 ? (
                  <div className="space-y-2">
                    {availableQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="p-2 border rounded hover:bg-accent cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddQuestion(question)}
                      >
                        <span className="text-sm line-clamp-1">
                          {question.text.substring(0, 50)}...
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4">
                    No questions found. Try adjusting your filters.
                  </p>
                )}
              </div>
            </div>

            {/* Selected Questions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Questions</h4>
              {selectedQuestions.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-2 border rounded bg-muted/50 flex justify-between items-center"
                    >
                      <span className="text-sm line-clamp-1">
                        {index + 1}. {question.text.substring(0, 40)}...
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveQuestion(question.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4 border rounded">
                  No questions selected
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tests')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {test ? 'Update Test' : 'Create Test'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
