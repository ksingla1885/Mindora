'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, X, Trash2, Upload, Image as ImageIcon, FileText, Video } from 'lucide-react';

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
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Form schema for validation
const courseFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  slug: z.string().min(3, {
    message: 'Slug must be at least 3 characters.',
  }).regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
  }),
  description: z.string().optional(),
  shortDescription: z.string().max(160, {
    message: 'Short description must be at most 160 characters.',
  }).optional(),
  category: z.string().min(1, {
    message: 'Please select a category.',
  }),
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select a difficulty level.',
  }),
  price: z.coerce.number().min(0, {
    message: 'Price must be a positive number.',
  }),
  isPaid: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  thumbnail: z.string().optional(),
  prerequisites: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'Section title is required'),
    description: z.string().optional(),
    lectures: z.array(z.object({
      id: z.string(),
      title: z.string().min(1, 'Lecture title is required'),
      type: z.enum(['video', 'article', 'quiz']),
      duration: z.number().min(0).optional(),
      isFree: z.boolean().default(false),
      content: z.string().optional(),
      resources: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        url: z.string(),
      })).default([]),
    })).default([]),
  })).default([]),
});

// Mock categories - replace with API call
const categories = [
  { id: 'jee-main', name: 'JEE Main' },
  { id: 'jee-advanced', name: 'JEE Advanced' },
  { id: 'neet', name: 'NEET' },
  { id: 'foundation', name: 'Foundation' },
  { id: 'olympiad', name: 'Olympiad' },
];

export function CourseForm({ course, onSuccess }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course || {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      category: '',
      level: 'intermediate',
      price: 0,
      isPaid: false,
      status: 'draft',
      featured: false,
      thumbnail: '',
      prerequisites: [],
      learningOutcomes: [],
      sections: [
        {
          id: `section-${Date.now()}`,
          title: 'Introduction',
          description: 'Introduction to the course',
          lectures: [],
        },
      ],
    },
  });

  const watchIsPaid = form.watch('isPaid');
  const watchSections = form.watch('sections');

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Prepare the data to send
      const courseData = {
        ...data,
        // Convert price to 0 if not paid
        price: data.isPaid ? data.price : 0,
      };

      // TODO: Replace with actual API call
      console.log('Submitting course:', courseData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success!',
        description: course ? 'Course updated successfully.' : 'Course created successfully.',
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/courses');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, type = 'image') => {
    try {
      setIsUploading(true);
      // TODO: Implement actual file upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock URL - replace with actual URL from your file storage
      const fileUrl = `https://example.com/uploads/${file.name}`;
      
      if (type === 'image') {
        form.setValue('thumbnail', fileUrl);
      }
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully!',
      });
      
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Add a new prerequisite
  const addPrerequisite = (e) => {
    e.preventDefault();
    if (newPrerequisite.trim()) {
      const currentPrerequisites = form.getValues('prerequisites') || [];
      form.setValue('prerequisites', [...currentPrerequisites, newPrerequisite.trim()]);
      setNewPrerequisite('');
    }
  };

  // Remove a prerequisite
  const removePrerequisite = (index) => {
    const currentPrerequisites = form.getValues('prerequisites') || [];
    form.setValue('prerequisites', currentPrerequisites.filter((_, i) => i !== index));
  };

  // Add a new learning outcome
  const addLearningOutcome = (e) => {
    e.preventDefault();
    if (newOutcome.trim()) {
      const currentOutcomes = form.getValues('learningOutcomes') || [];
      form.setValue('learningOutcomes', [...currentOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };

  // Remove a learning outcome
  const removeLearningOutcome = (index) => {
    const currentOutcomes = form.getValues('learningOutcomes') || [];
    form.setValue('learningOutcomes', currentOutcomes.filter((_, i) => i !== index));
  };

  // Add a new section
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '',
      lectures: [],
    };
    form.setValue('sections', [...form.getValues('sections'), newSection]);
  };

  // Remove a section
  const removeSection = (index) => {
    const sections = [...form.getValues('sections')];
    sections.splice(index, 1);
    form.setValue('sections', sections);
  };

  // Add a new lecture to a section
  const addLecture = (sectionIndex) => {
    const sections = [...form.getValues('sections')];
    sections[sectionIndex].lectures.push({
      id: `lecture-${Date.now()}`,
      title: 'New Lecture',
      type: 'video',
      isFree: false,
      content: '',
      resources: [],
    });
    form.setValue('sections', sections);
  };

  // Remove a lecture from a section
  const removeLecture = (sectionIndex, lectureIndex) => {
    const sections = [...form.getValues('sections')];
    sections[sectionIndex].lectures.splice(lectureIndex, 1);
    form.setValue('sections', sections);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {course ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Fill in the details to {course ? 'update' : 'create'} your course
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/courses')}
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
                  {course ? 'Updating...' : 'Creating...'}
                </span>
              ) : course ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content" disabled={!form.formState.isValid}>
              Course Content
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!form.formState.isValid}>
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Basic information about your course
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Complete JEE Main Physics" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear and descriptive title for your course
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug *</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                              /courses/
                            </span>
                            <Input
                              placeholder="e.g., jee-main-physics"
                              className="rounded-l-none"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          A URL-friendly version of the title (lowercase, hyphens, no spaces)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of your course (max 160 characters)"
                          className="min-h-[80px]"
                          maxLength={160}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be displayed on course cards and search results
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
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A detailed description of your course"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be displayed on the course details page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Course Thumbnail</FormLabel>
                  <div className="mt-2 flex items-center gap-4">
                    {form.watch('thumbnail') ? (
                      <div className="relative group">
                        <img
                          src={form.watch('thumbnail')}
                          alt="Course thumbnail"
                          className="h-32 w-56 rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => form.setValue('thumbnail', '')}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-md p-6 text-center w-56">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-500">No thumbnail</p>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="thumbnail-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleFileUpload(file, 'image');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Upload Thumbnail'}
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Recommended size: 800x450px (16:9 aspect ratio)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Prerequisites</CardTitle>
                <p className="text-sm text-muted-foreground">
                  What students should know before taking this course
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {form.watch('prerequisites')?.map((prereq, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 p-2 rounded-md">
                        {prereq}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrerequisite(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <form onSubmit={addPrerequisite} className="flex gap-2">
                  <Input
                    placeholder="Add a prerequisite (e.g., Basic knowledge of algebra)"
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                  />
                  <Button type="submit" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What Students Will Learn</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Key learning outcomes for this course
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {form.watch('learningOutcomes')?.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-1 bg-gray-50 p-2 rounded-md">
                        {outcome}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLearningOutcome(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <form onSubmit={addLearningOutcome} className="flex gap-2">
                  <Input
                    placeholder="Add a learning outcome (e.g., Solve complex physics problems)"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                  />
                  <Button type="submit" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Course Content</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Organize your course content into sections and lectures
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSection}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {watchSections?.length > 0 ? (
                  <div className="space-y-4">
                    {watchSections.map((section, sectionIndex) => (
                      <div key={section.id} className="border rounded-md">
                        <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {section.title || 'Untitled Section'}
                            </h3>
                            <Badge variant="outline">
                              {section.lectures?.length || 0} lectures
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addLecture(sectionIndex)}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Lecture
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSection(sectionIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <Input
                            placeholder="Section Title"
                            value={section.title}
                            onChange={(e) => {
                              const sections = [...watchSections];
                              sections[sectionIndex].title = e.target.value;
                              form.setValue('sections', sections);
                            }}
                          />
                          <Textarea
                            placeholder="Section Description (Optional)"
                            value={section.description || ''}
                            onChange={(e) => {
                              const sections = [...watchSections];
                              sections[sectionIndex].description = e.target.value;
                              form.setValue('sections', sections);
                            }}
                            className="min-h-[80px]"
                          />
                          
                          {/* Lectures */}
                          <div className="space-y-2 mt-4">
                            {section.lectures?.map((lecture, lectureIndex) => (
                              <div key={lecture.id} className="border rounded p-3 bg-white">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                      {lecture.type === 'video' && (
                                        <Video className="h-5 w-5 text-blue-500" />
                                      )}
                                      {lecture.type === 'article' && (
                                        <FileText className="h-5 w-5 text-green-500" />
                                      )}
                                      {lecture.type === 'quiz' && (
                                        <FileText className="h-5 w-5 text-purple-500" />
                                      )}
                                    </div>
                                    <div>
                                      <Input
                                        value={lecture.title}
                                        onChange={(e) => {
                                          const sections = [...watchSections];
                                          sections[sectionIndex].lectures[lectureIndex].title = e.target.value;
                                          form.setValue('sections', sections);
                                        }}
                                        className="border-0 p-0 h-auto font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                                      />
                                      <div className="flex items-center gap-2 mt-1">
                                        <Select
                                          value={lecture.type}
                                          onValueChange={(value) => {
                                            const sections = [...watchSections];
                                            sections[sectionIndex].lectures[lectureIndex].type = value;
                                            form.setValue('sections', sections);
                                          }}
                                        >
                                          <SelectTrigger className="h-8 w-32">
                                            <SelectValue placeholder="Type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="article">Article</SelectItem>
                                            <SelectItem value="quiz">Quiz</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        
                                        <div className="flex items-center gap-2 ml-2">
                                          <Checkbox
                                            id={`lecture-${lecture.id}-free`}
                                            checked={lecture.isFree}
                                            onCheckedChange={(checked) => {
                                              const sections = [...watchSections];
                                              sections[sectionIndex].lectures[lectureIndex].isFree = checked;
                                              form.setValue('sections', sections);
                                            }}
                                          />
                                          <Label htmlFor={`lecture-${lecture.id}-free`} className="text-xs">
                                            Free Preview
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLecture(sectionIndex, lectureIndex)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                                
                                {/* Lecture Content */}
                                <div className="mt-3 pl-8">
                                  {lecture.type === 'video' && (
                                    <div className="space-y-2">
                                      <Label>Video Content</Label>
                                      <div className="border-2 border-dashed rounded-md p-4 text-center">
                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          {lecture.content ? 'Video uploaded' : 'Upload video file or paste embed code'}
                                        </p>
                                        <div className="mt-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mr-2"
                                          >
                                            Upload Video
                                          </Button>
                                          <Button type="button" variant="outline" size="sm">
                                            Embed Video
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {lecture.type === 'article' && (
                                    <div className="space-y-2">
                                      <Label>Article Content</Label>
                                      <Textarea
                                        placeholder="Write your article content here..."
                                        value={lecture.content || ''}
                                        onChange={(e) => {
                                          const sections = [...watchSections];
                                          sections[sectionIndex].lectures[lectureIndex].content = e.target.value;
                                          form.setValue('sections', sections);
                                        }}
                                        className="min-h-[200px]"
                                      />
                                    </div>
                                  )}
                                  
                                  {lecture.type === 'quiz' && (
                                    <div className="space-y-2">
                                      <Label>Quiz Content</Label>
                                      <div className="border-2 border-dashed rounded-md p-4 text-center">
                                        <p className="text-sm text-gray-500">
                                          {lecture.content ? 'Quiz configured' : 'Add quiz questions and settings'}
                                        </p>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="mt-2"
                                        >
                                          Configure Quiz
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Resources */}
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between">
                                      <Label>Resources</Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                      >
                                        <Plus className="h-4 w-4 mr-1" /> Add Resource
                                      </Button>
                                    </div>
                                    {lecture.resources?.length > 0 ? (
                                      <div className="mt-2 space-y-2">
                                        {lecture.resources.map((resource, resIndex) => (
                                          <div key={resource.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-gray-500" />
                                              <span className="text-sm">{resource.name}</span>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                            >
                                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        No resources added yet.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium">No sections yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get started by adding your first section
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={addSection}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Section
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set the price for your course
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Paid Course</FormLabel>
                        <FormDescription>
                          {field.value
                            ? 'Students will need to purchase this course to access its content.'
                            : 'This course will be available for free.'}
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
                      <FormItem className="max-w-xs">
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Control the visibility of your course
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'draft' && 'Only you can see this course.'}
                        {field.value === 'published' && 'This course is visible to students.'}
                        {field.value === 'archived' && 'This course is hidden from students.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Course</FormLabel>
                        <FormDescription>
                          {field.value
                            ? 'This course will be featured on the homepage.'
                            : 'This course will not be featured on the homepage.'}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
