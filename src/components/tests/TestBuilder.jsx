'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, Image as ImageIcon, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Form validation schema
const testFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  passingScore: z.number().min(0).max(100),
  isPublic: z.boolean().default(false),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string().min(5, 'Question text is required'),
      type: z.enum(['MCQ', 'DESCRIPTIVE']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
      explanation: z.string().optional(),
      marks: z.number().min(0.5, 'Marks must be at least 0.5'),
      difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    })
  ).min(1, 'At least one question is required'),
});

export function TestBuilder({ initialData, onSubmit, isSubmitting = false, subjects = [] }) {
  const [activeTab, setActiveTab] = useState('details');
  const [imagePreview, setImagePreview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const { 
    control, 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(testFormSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      subject: '',
      duration: 30,
      passingScore: 60,
      isPublic: false,
      questions: [
        {
          text: '',
          type: 'MCQ',
          options: ['', '', ''],
          correctAnswer: '',
          marks: 1,
          difficulty: 'medium',
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const currentQuestion = watch(`questions.${currentQuestionIndex}`);
  const questionType = watch(`questions.${currentQuestionIndex}.type`);

  const handleAddQuestion = useCallback(() => {
    append({
      text: '',
      type: 'MCQ',
      options: ['', '', ''],
      correctAnswer: '',
      marks: 1,
      difficulty: 'medium',
    });
    setCurrentQuestionIndex(fields.length);
  }, [append, fields.length]);

  const handleRemoveQuestion = useCallback((index) => {
    remove(index);
    if (currentQuestionIndex >= index && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    }
  }, [currentQuestionIndex, remove]);

  const addOption = (qIndex, type = 'option') => {
    const newQuestions = [...fields];
    const question = newQuestions[qIndex];

    if (type === 'option' || question.type === 'MCQ') {
      const newOption = {
        id: `opt-${Date.now()}`,
        text: '',
        isCorrect: false,
      };
      question.options = question.options || [];
      question.options.push(newOption);
    } else if (type === 'matching' && question.type === 'MATCHING') {
      question.matchingPairs = question.matchingPairs || [];
      question.matchingPairs.push({
        id: `pair-${Date.now()}`,
        left: '',
        right: '',
      });
    } else if (type === 'ordering' && question.type === 'ORDERING') {
      question.orderedItems = question.orderedItems || [];
      question.orderedItems.push({
        id: `item-${Date.now()}`,
        text: '',
        correctPosition: question.orderedItems.length + 1,
      });
    }

    setValue(`questions.${qIndex}`, question);
  };

  const handleAddOption = useCallback(() => {
    addOption(currentQuestionIndex);
  }, [currentQuestionIndex]);

  const handleRemoveOption = useCallback((optionIndex) => {
    const options = [...(currentQuestion.options || [])];
    options.splice(optionIndex, 1);
    setValue(`questions.${currentQuestionIndex}.options`, options);

    // Clear correct answer if it was the removed option
    if (currentQuestion.correctAnswer === currentQuestion.options[optionIndex]) {
      setValue(`questions.${currentQuestionIndex}.correctAnswer`, '');
    }
  }, [currentQuestion, currentQuestionIndex, setValue]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update form values
    items.forEach((item, index) => {
      setValue(`questions.${index}`, item);
    });

    // Update current question index if needed
    if (currentQuestionIndex === result.source.index) {
      setCurrentQuestionIndex(result.destination.index);
    } else if (
      currentQuestionIndex > result.source.index &&
      currentQuestionIndex <= result.destination.index
    ) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (
      currentQuestionIndex < result.source.index &&
      currentQuestionIndex >= result.destination.index
    ) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Set preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      // TODO: Upload to server and get URL
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (data) => {
    // Process and submit data
    onSubmit(data);
  };

  const renderQuestionForm = (question, index) => {
    const isFirst = index === 0;
    const isLast = index === fields.length - 1;
    const showOptions = ['MCQ', 'MATCHING', 'ORDERING'].includes(question.type);
    const showMatching = question.type === 'MATCHING';
    const showOrdering = question.type === 'ORDERING';

    return (
      <div key={question.id} className="space-y-4 p-4 border rounded-lg mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Label>Question {index + 1}</Label>
            <Textarea
              value={question.text}
              onChange={(e) => setValue(`questions.${index}.text`, e.target.value)}
              placeholder="Enter question text"
              className="mt-1"
            />
          </div>
          <div className="ml-4 w-48">
            <Label>Question Type</Label>
            <Select
              value={question.type}
              onValueChange={(value) => {
                setValue(`questions.${index}.type`, value);
                if (value === 'DESCRIPTIVE') {
                  setValue(`questions.${index}.options`, undefined);
                  setValue(`questions.${index}.correctAnswer`, '');
                } else if (value === 'MCQ') {
                  setValue(`questions.${index}.options`, ['', '', '']);
                } else if (value === 'MATCHING') {
                  setValue(`questions.${index}.matchingPairs`, []);
                } else if (value === 'ORDERING') {
                  setValue(`questions.${index}.orderedItems`, []);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showMatching && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Matching Pairs</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(index, 'matching')}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Pair
              </Button>
            </div>
            {(question.matchingPairs || []).map((pair, pairIndex) => (
              <div key={pair.id} className="flex items-center space-x-2">
                <Input
                  value={pair.left}
                  onChange={(e) => {
                    const newPairs = [...(question.matchingPairs || [])];
                    newPairs[pairIndex].left = e.target.value;
                    setValue(`questions.${index}.matchingPairs`, newPairs);
                  }}
                  placeholder="Left item"
                  className="flex-1"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  value={pair.right}
                  onChange={(e) => {
                    const newPairs = [...(question.matchingPairs || [])];
                    newPairs[pairIndex].right = e.target.value;
                    setValue(`questions.${index}.matchingPairs`, newPairs);
                  }}
                  placeholder="Right item"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newPairs = [...(question.matchingPairs || [])];
                    newPairs.splice(pairIndex, 1);
                    setValue(`questions.${index}.matchingPairs`, newPairs);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showOrdering && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Items to Order</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(index, 'ordering')}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {(question.orderedItems || []).map((item, itemIndex) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <span className="text-muted-foreground w-6 text-center">
                    {item.correctPosition}
                  </span>
                  <Input
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...(question.orderedItems || [])];
                      newItems[itemIndex].text = e.target.value;
                      setValue(`questions.${index}.orderedItems`, newItems);
                    }}
                    placeholder={`Item ${itemIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = [...(question.orderedItems || [])];
                      newItems.splice(itemIndex, 1);
                      setValue(`questions.${index}.orderedItems`, newItems);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Create New Test</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Test'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Questions list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Questions</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddQuestion}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fields.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No questions added yet
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="divide-y"
                      >
                        {fields.map((question, index) => (
                          <Draggable
                            key={question.id}
                            draggableId={`question-${question.id}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  'p-3 flex items-center space-x-2 cursor-pointer hover:bg-muted/50',
                                  currentQuestionIndex === index && 'bg-muted'
                                )}
                                onClick={() => setCurrentQuestionIndex(index)}
                              >
                                <div {...provided.dragHandleProps} className="text-muted-foreground">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <span className="flex-1 truncate">
                                  {question.text || `Question ${index + 1}`}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveQuestion(index);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
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
            </CardContent>
          </Card>
        </div>

        {/* Main content - Question editor */}
        <div className="lg:col-span-3 space-y-6">
          {/* Test details */}
          {activeTab === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Test Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter test title"
                    {...register('title')}
                    error={errors.title?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter test description"
                    {...register('description')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      onValueChange={(value) => setValue('subject', value)}
                      value={watch('subject')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      {...register('duration', { valueAsNumber: true })}
                      error={errors.duration?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="passingScore">Passing Score (%) *</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min={0}
                      max={100}
                      {...register('passingScore', { valueAsNumber: true })}
                      error={errors.passingScore?.message}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Controller
                      name="isPublic"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="isPublic"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isPublic">Make this test public</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question editor */}
          {activeTab === 'questions' && fields.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-muted-foreground">
                      {questionType === 'MCQ' ? 'Multiple Choice' : questionType === 'MATCHING' ? 'Matching' : questionType === 'ORDERING' ? 'Ordering' : 'Descriptive'}
                    </Label>
                    <Select
                      value={questionType}
                      onValueChange={(value) => {
                        setValue(`questions.${currentQuestionIndex}.type`, value);
                        if (value === 'DESCRIPTIVE') {
                          setValue(`questions.${currentQuestionIndex}.options`, undefined);
                          setValue(`questions.${currentQuestionIndex}.correctAnswer`, '');
                        } else {
                          setValue(`questions.${currentQuestionIndex}.options`, ['', '', '']);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MCQ">Multiple Choice</SelectItem>
                        <SelectItem value="DESCRIPTIVE">Descriptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Question Text *</Label>
                  <Textarea
                    placeholder="Enter question text"
                    {...register(`questions.${currentQuestionIndex}.text`)}
                    error={
                      errors.questions?.[currentQuestionIndex]?.text?.message
                    }
                    rows={3}
                  />
                </div>

                {/* Image upload */}
                <div>
                  <Label>Add Image (Optional)</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Question preview"
                            className="max-h-48 mx-auto rounded-md"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/90 hover:bg-destructive text-white"
                            onClick={() => setImagePreview(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <div className="flex text-sm text-muted-foreground">
                            <label
                              htmlFor="question-image"
                              className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                            >
                              <span>Upload an image</span>
                              <input
                                id="question-image"
                                name="question-image"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Options for MCQ */}
                {questionType === 'MCQ' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Options *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOption}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {currentQuestion.options?.map((_, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`option-${currentQuestionIndex}-${optionIndex}`}
                            name={`correct-answer-${currentQuestionIndex}`}
                            checked={currentQuestion.correctAnswer === currentQuestion.options[optionIndex]}
                            onChange={() => {
                              setValue(
                                `questions.${currentQuestionIndex}.correctAnswer`,
                                currentQuestion.options[optionIndex]
                              );
                            }}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={currentQuestion.options[optionIndex] || ''}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[optionIndex] = e.target.value;
                              setValue(`questions.${currentQuestionIndex}.options`, newOptions);
                              
                              // Update correct answer if this option was selected
                              if (currentQuestion.correctAnswer === currentQuestion.options[optionIndex]) {
                                setValue(
                                  `questions.${currentQuestionIndex}.correctAnswer`,
                                  e.target.value
                                );
                              }
                            }}
                            error={
                              errors.questions?.[currentQuestionIndex]?.options?.[optionIndex]?.message
                            }
                          />
                          {currentQuestion.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveOption(optionIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {errors.questions?.[currentQuestionIndex]?.correctAnswer && (
                        <p className="text-sm font-medium text-destructive">
                          Please select the correct answer
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    placeholder="Add explanation for the correct answer"
                    {...register(`questions.${currentQuestionIndex}.explanation`)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Marks *</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      {...register(`questions.${currentQuestionIndex}.marks`, {
                        valueAsNumber: true,
                      })}
                      error={
                        errors.questions?.[currentQuestionIndex]?.marks?.message
                      }
                    />
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={currentQuestion.difficulty || 'medium'}
                      onValueChange={(value) => {
                        setValue(
                          `questions.${currentQuestionIndex}.difficulty`,
                          value
                        );
                      }}
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (activeTab === 'questions') {
              setActiveTab('details');
            } else if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
            }
          }}
          disabled={
            (activeTab === 'details' && currentQuestionIndex === 0) ||
            (activeTab === 'questions' && currentQuestionIndex === 0)
          }
        >
          Previous
        </Button>

        <Button
          type="button"
          onClick={() => {
            if (activeTab === 'details') {
              setActiveTab('questions');
            } else if (currentQuestionIndex < fields.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
              handleAddQuestion();
            }
          }}
        >
          {currentQuestionIndex < fields.length - 1 ? 'Next Question' : 'Add Another Question'}
        </Button>
      </div>
    </div>
  );
}
