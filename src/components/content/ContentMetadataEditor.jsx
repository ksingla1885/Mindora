'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Tag, Clock, BookOpen, Award, Bookmark, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const contentTypes = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'formula', label: 'Formula', icon: FileText },
];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Content type is required'),
  difficulty: z.string().optional(),
  duration: z.number().min(0, 'Duration must be a positive number').optional(),
  subject: z.string().optional(),
  classLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPremium: z.boolean().default(false),
  thumbnail: z.string().url('Invalid URL').optional().or(z.literal('')),
  externalUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  relatedContent: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
});

export default function ContentMetadataEditor({
  initialData = {},
  onSubmit,
  className = '',
  isSubmitting = false,
  submitLabel = 'Save Metadata',
}) {
  const [tagInput, setTagInput] = useState('');
  const [learningObjectiveInput, setLearningObjectiveInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: '',
      difficulty: 'beginner',
      duration: 0,
      subject: '',
      classLevel: '',
      tags: [],
      isPremium: false,
      thumbnail: '',
      externalUrl: '',
      relatedContent: [],
      learningObjectives: [],
      prerequisites: [],
      ...initialData,
    },
  });
  
  const watchType = form.watch('type');
  
  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !form.getValues('tags')?.includes(tag)) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, tag]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    form.setValue(
      'tags',
      form.getValues('tags')?.filter((tag) => tag !== tagToRemove) || []
    );
  };
  
  const handleAddLearningObjective = (e) => {
    e.preventDefault();
    const objective = learningObjectiveInput.trim();
    if (objective) {
      const currentObjectives = form.getValues('learningObjectives') || [];
      form.setValue('learningObjectives', [...currentObjectives, objective]);
      setLearningObjectiveInput('');
    }
  };
  
  const handleRemoveLearningObjective = (index) => {
    const currentObjectives = [...(form.getValues('learningObjectives') || [])];
    currentObjectives.splice(index, 1);
    form.setValue('learningObjectives', currentObjectives);
  };
  
  const handleAddPrerequisite = (e) => {
    e.preventDefault();
    const prerequisite = prerequisiteInput.trim();
    if (prerequisite) {
      const currentPrerequisites = form.getValues('prerequisites') || [];
      form.setValue('prerequisites', [...currentPrerequisites, prerequisite]);
      setPrerequisiteInput('');
    }
  };
  
  const handleRemovePrerequisite = (index) => {
    const currentPrerequisites = [...(form.getValues('prerequisites') || [])];
    currentPrerequisites.splice(index, 1);
    form.setValue('prerequisites', currentPrerequisites);
  };
  
  const handleSubmit = (data) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };
  
  return (
    <div className={cn('space-y-6', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter content title" {...field} />
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
                        placeholder="Enter a brief description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contentTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {difficultyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Duration in minutes"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Physics, Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="classLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class/Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 9, 10, 11, 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isPremium"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Premium Content</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Only available to premium users
                      </p>
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
            </div>
            
            {/* Media & Resources */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Media & Resources</h3>
              
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://example.com/thumbnail.jpg" 
                          {...field} 
                        />
                        {field.value && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => field.onChange('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2 rounded-md overflow-hidden border w-32">
                        <img 
                          src={field.value} 
                          alt="Thumbnail preview" 
                          className="w-full h-auto"
                          onError={(e) => {
                            e.target.src = '/placeholder-thumbnail.jpg';
                          }}
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              {['video', 'pdf'].includes(watchType) && (
                <FormField
                  control={form.control}
                  name="externalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchType === 'video' ? 'Video URL' : 'PDF URL'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={
                            watchType === 'video' 
                              ? 'https://youtube.com/watch?v=... or https://vimeo.com/...' 
                              : 'https://example.com/document.pdf'
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="pt-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('tags')?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              
              <div className="space-y-2">
                <FormLabel>Learning Objectives</FormLabel>
                <div className="space-y-2">
                  {form.watch('learningObjectives')?.map((obj, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                      <BookOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-grow text-sm">{obj}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLearningObjective(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <form onSubmit={handleAddLearningObjective} className="flex gap-2">
                    <Input
                      placeholder="Add a learning objective"
                      value={learningObjectiveInput}
                      onChange={(e) => setLearningObjectiveInput(e.target.value)}
                    />
                    <Button type="submit" variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              
              <div className="space-y-2">
                <FormLabel>Prerequisites</FormLabel>
                <div className="space-y-2">
                  {form.watch('prerequisites')?.map((pre, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                      <Bookmark className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-grow text-sm">{pre}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrerequisite(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <form onSubmit={handleAddPrerequisite} className="flex gap-2">
                    <Input
                      placeholder="Add a prerequisite"
                      value={prerequisiteInput}
                      onChange={(e) => setPrerequisiteInput(e.target.value)}
                    />
                    <Button type="submit" variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
