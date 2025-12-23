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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash, X, Loader2 } from 'lucide-react';

// Question type schemas
const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean().default(false),
  explanation: z.string().optional(),
});

const baseQuestionSchema = {
  text: z.string().min(5, 'Question text is required'),
  type: z.enum(['mcq', 'true_false', 'short_answer', 'fill_blank', 'matching', 'essay']),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  marks: z.number().int().positive('Marks must be positive').default(1),
  isActive: z.boolean().default(true),
  explanation: z.string().optional(),
  tags: z.array(z.string()).default([]),
};

// Create different schemas based on question type
const questionSchemas = {
  mcq: z.object({
    ...baseQuestionSchema,
    options: z.array(optionSchema).min(2, 'At least two options are required'),
    multipleAnswers: z.boolean().default(false),
  }),
  true_false: z.object({
    ...baseQuestionSchema,
    correctAnswer: z.boolean(),
  }),
  short_answer: z.object({
    ...baseQuestionSchema,
    modelAnswer: z.string().min(1, 'Model answer is required'),
    keywords: z.array(z.string()).default([]),
  }),
  fill_blank: z.object({
    ...baseQuestionSchema,
    blanks: z.array(
      z.object({
        position: z.number(),
        correctText: z.string().min(1, 'Correct text is required'),
        caseSensitive: z.boolean().default(false),
      })
    ),
  }),
  matching: z.object({
    ...baseQuestionSchema,
    matchingPairs: z.array(
      z.object({
        id: z.string(),
        left: z.string().min(1, 'Left side is required'),
        right: z.string().min(1, 'Right side is required'),
      })
    ).min(2, 'At least two pairs are required'),
  }),
  essay: z.object({
    ...baseQuestionSchema,
    wordLimit: z.number().int().positive('Word limit must be positive').optional(),
    gradingRubric: z.string().optional(),
  }),
};

export function QuestionForm({ question, onSubmit, isSubmitting = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('general');

  // Initialize form with default values based on question type
  const form = useForm({
    resolver: zodResolver(questionSchemas[question?.type || 'mcq']),
    defaultValues: question || {
      type: 'mcq', // Default to MCQ
      difficulty: 'medium',
      marks: 1,
      isActive: true,
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
      ],
      multipleAnswers: false,
      tags: [],
    },
  });

  const questionType = form.watch('type');
  const options = form.watch('options') || [];
  const multipleAnswers = form.watch('multipleAnswers');

  // Fetch subjects and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [subjectsRes, classesRes] = await Promise.all([
          fetch('/api/subjects'),
          fetch('/api/classes'),
        ]);

        if (!subjectsRes.ok || !classesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const subjectsData = await subjectsRes.json();
        const classesData = await classesRes.json();

        setSubjects(subjectsData.subjects || []);
        setClasses(classesData.classes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update form validation schema when question type changes
  useEffect(() => {
    if (questionType) {
      form.clearErrors();
      form.reset({
        ...form.getValues(),
        type: questionType,
        // Reset type-specific fields when type changes
        ...(questionType !== 'mcq' && { options: undefined }),
        ...(questionType !== 'true_false' && { correctAnswer: undefined }),
        ...(questionType !== 'short_answer' && { modelAnswer: undefined, keywords: [] }),
        ...(questionType !== 'fill_blank' && { blanks: undefined }),
        ...(questionType !== 'matching' && { matchingPairs: undefined }),
        ...(questionType !== 'essay' && { wordLimit: undefined, gradingRubric: undefined }),
      });
    }
  }, [questionType, form]);

  // Handle form submission
  const handleSubmit = async (data) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      toast({
        title: 'Success',
        description: question ? 'Question updated successfully' : 'Question created successfully',
      });
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save question',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new option
  const addOption = () => {
    const newOption = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false,
    };
    form.setValue('options', [...options, newOption]);
  };

  // Handle removing an option
  const removeOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    form.setValue('options', newOptions);
  };

  // Toggle correct answer for an option
  const toggleCorrectAnswer = (index) => {
    const newOptions = [...options];
    
    if (!multipleAnswers) {
      // For single answer, only one option can be correct
      newOptions.forEach((opt, i) => {
        newOptions[i].isCorrect = i === index;
      });
    } else {
      // For multiple answers, toggle the selected option
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    }
    
    form.setValue('options', newOptions);
  };

  // Add a new matching pair
  const addMatchingPair = () => {
    const pairs = form.getValues('matchingPairs') || [];
    form.setValue('matchingPairs', [
      ...pairs,
      { id: Date.now().toString(), left: '', right: '' },
    ]);
  };

  // Remove a matching pair
  const removeMatchingPair = (index) => {
    const pairs = form.getValues('matchingPairs') || [];
    form.setValue('matchingPairs', pairs.filter((_, i) => i !== index));
  };

  // Add a blank
  const addBlank = () => {
    const blanks = form.getValues('blanks') || [];
    form.setValue('blanks', [
      ...blanks,
      { position: blanks.length, correctText: '', caseSensitive: false },
    ]);
  };

  // Remove a blank
  const removeBlank = (index) => {
    const blanks = form.getValues('blanks') || [];
    form.setValue('blanks', blanks.filter((_, i) => i !== index));
  };

  // Add a keyword
  const addKeyword = () => {
    const keywords = form.getValues('keywords') || [];
    form.setValue('keywords', [...keywords, '']);
  };

  // Update a keyword
  const updateKeyword = (index, value) => {
    const keywords = [...(form.getValues('keywords') || [])];
    keywords[index] = value;
    form.setValue('keywords', keywords);
  };

  // Remove a keyword
  const removeKeyword = (index) => {
    const keywords = form.getValues('keywords') || [];
    form.setValue('keywords', keywords.filter((_, i) => i !== index));
  };

  // Add a tag
  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const tags = form.getValues('tags') || [];
      if (!tags.includes(e.target.value.trim())) {
        form.setValue('tags', [...tags, e.target.value.trim()]);
        e.target.value = '';
      }
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove) => {
    const tags = form.getValues('tags') || [];
    form.setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content" disabled={!form.formState.isDirty && !question}>
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!form.formState.isDirty && !question}>
              Settings
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                          <SelectItem value="matching">Matching</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
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
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
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
                        <Input placeholder="E.g., Algebra, Thermodynamics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {form.watch('tags')?.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Add a tag and press Enter"
                      className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
                      onKeyDown={addTag}
                    />
                  </div>
                  <FormDescription>
                    Add tags to help organize and find questions (e.g., "algebra", "thermodynamics", "important")
                  </FormDescription>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your question here..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {questionType === 'mcq' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Options *</FormLabel>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="multiple-answers"
                            checked={multipleAnswers}
                            onCheckedChange={(checked) => {
                              form.setValue('multipleAnswers', checked);
                              // If switching from multiple to single, ensure only one correct answer
                              if (!checked && options) {
                                const hasCorrect = options.some(opt => opt.isCorrect);
                                if (hasCorrect) {
                                  // Keep the first correct answer, uncheck others
                                  const newOptions = options.map((opt, i) => ({
                                    ...opt,
                                    isCorrect: i === options.findIndex(o => o.isCorrect)
                                  }));
                                  form.setValue('options', newOptions);
                                }
                              }
                            }}
                          />
                          <label
                            htmlFor="multiple-answers"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Multiple Answers
                          </label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {options.map((option, index) => (
                        <div key={option.id || index} className="flex items-start gap-3">
                          <div className="mt-2">
                            <Checkbox
                              id={`option-${index}`}
                              checked={option.isCorrect || false}
                              onCheckedChange={() => toggleCorrectAnswer(index)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index].text = e.target.value;
                                form.setValue('options', newOptions);
                              }}
                            />
                          </div>
                          {options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeOption(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground">
                        {multipleAnswers
                          ? 'Select all correct answers'
                          : 'Select the correct answer'}
                      </p>
                    </div>
                  </div>
                )}

                {questionType === 'true_false' && (
                  <div className="space-y-4">
                    <FormLabel>Correct Answer *</FormLabel>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="true-option"
                          name="true-false"
                          checked={form.watch('correctAnswer') === true}
                          onChange={() => form.setValue('correctAnswer', true)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor="true-option" className="text-sm font-medium">
                          True
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="false-option"
                          name="true-false"
                          checked={form.watch('correctAnswer') === false}
                          onChange={() => form.setValue('correctAnswer', false)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor="false-option" className="text-sm font-medium">
                          False
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {questionType === 'short_answer' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="modelAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Answer *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter the model answer..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Keywords (Optional)</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addKeyword}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Keyword
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {form.watch('keywords')?.map((keyword, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={keyword}
                              onChange={(e) => updateKeyword(index, e.target.value)}
                              placeholder="Enter a keyword"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeKeyword(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add keywords that should be present in the student's answer
                      </p>
                    </div>
                  </div>
                )}

                {questionType === 'fill_blank' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Blanks</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addBlank}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Blank
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {form.watch('blanks')?.map((blank, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Correct text for blank"
                              value={blank.correctText}
                              onChange={(e) => {
                                const newBlanks = [...form.getValues('blanks')];
                                newBlanks[index].correctText = e.target.value;
                                form.setValue('blanks', newBlanks);
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`case-sensitive-${index}`}
                                checked={blank.caseSensitive || false}
                                onCheckedChange={(checked) => {
                                  const newBlanks = [...form.getValues('blanks')];
                                  newBlanks[index].caseSensitive = checked;
                                  form.setValue('blanks', newBlanks);
                                }}
                              />
                              <label
                                htmlFor={`case-sensitive-${index}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Case sensitive
                              </label>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive mt-1"
                            onClick={() => removeBlank(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use {'{{BLANK}}}'} in the question text where you want the blank to appear
                    </p>
                  </div>
                )}

                {questionType === 'matching' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Matching Pairs</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMatchingPair}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Pair
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {form.watch('matchingPairs')?.map((pair, index) => (
                        <div key={pair.id} className="flex items-center gap-3">
                          <div className="grid grid-cols-2 gap-3 flex-1">
                            <Input
                              placeholder="Left item"
                              value={pair.left}
                              onChange={(e) => {
                                const newPairs = [...form.getValues('matchingPairs')];
                                newPairs[index].left = e.target.value;
                                form.setValue('matchingPairs', newPairs);
                              }}
                            />
                            <Input
                              placeholder="Right item"
                              value={pair.right}
                              onChange={(e) => {
                                const newPairs = [...form.getValues('matchingPairs')];
                                newPairs[index].right = e.target.value;
                                form.setValue('matchingPairs', newPairs);
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeMatchingPair(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {questionType === 'essay' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="wordLimit"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Word Limit (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g., 500"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gradingRubric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grading Rubric (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide grading criteria or instructions for evaluators..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide an explanation or solution for this question..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be shown to students after they complete the test (if enabled).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive questions won't be available in new tests
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {question ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
