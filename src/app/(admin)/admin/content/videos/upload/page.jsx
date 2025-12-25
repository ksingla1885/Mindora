'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload as UploadIcon, X, FileVideo, FileText, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const videoFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  courseId: z.string().min(1, 'Please select a course'),
  sectionId: z.string().min(1, 'Please select a section'),
  isFree: z.boolean().default(false),
  allowDownload: z.boolean().default(false),
  tags: z.string().optional(),
});

export default function UploadVideoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Mock data - replace with actual API call
  const courses = [
    { id: '1', title: 'JEE Main Physics' },
    { id: '2', title: 'JEE Advanced Mathematics' },
    { id: '3', title: 'NEET Chemistry' },
  ];
  
  const sections = [
    { id: '1', title: 'Introduction', courseId: '1' },
    { id: '2', title: 'Mechanics', courseId: '1' },
    { id: '3', title: 'Calculus', courseId: '2' },
    { id: '4', title: 'Algebra', courseId: '2' },
    { id: '5', title: 'Organic Chemistry', courseId: '3' },
  ];

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      isFree: false,
      allowDownload: false,
    },
  });

  const selectedCourseId = watch('courseId');
  const filteredSections = sections.filter(section => section.courseId === selectedCourseId);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a video file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Replace with actual API call
      // const formData = new FormData();
      // formData.append('video', selectedFile);
      // formData.append('thumbnail', thumbnailFile);
      // formData.append('data', JSON.stringify(data));
      
      // const response = await fetch('/api/videos/upload', {
      //   method: 'POST',
      //   body: formData,
      //   onUploadProgress: (progressEvent) => {
      //     const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      //     setUploadProgress(progress);
      //   },
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      clearInterval(interval);
      setUploadProgress(100);
      
      // const result = await response.json();
      // if (!response.ok) throw new Error(result.message || 'Upload failed');

      toast({
        title: 'Success',
        description: 'Video uploaded successfully!',
      });

      // Redirect to videos list after a short delay
      setTimeout(() => {
        router.push('/admin/content/videos');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8">
          <Link href="/admin/content/videos">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Video</h1>
          <p className="text-muted-foreground">
            Add a new video to your content library
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Video upload */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video File</CardTitle>
                <CardDescription>
                  Upload your video file. Supported formats: MP4, MOV, AVI, MKV
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UploadIcon className="h-10 w-10 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        {isDragActive ? (
                          <p>Drop the video file here</p>
                        ) : (
                          <>
                            <p className="font-medium">Drag and drop your video file here</p>
                            <p className="text-xs">or click to browse files</p>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max file size: 2GB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="relative aspect-video bg-black">
                      <video
                        src={previewUrl}
                        className="h-full w-full object-contain"
                        controls
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={removeFile}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </div>
                    <div className="p-4 border-t">
                      <div className="flex items-center space-x-2">
                        <FileVideo className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
                <CardDescription>
                  Upload a thumbnail image for your video (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-20 rounded-md border flex items-center justify-center bg-muted">
                    {thumbnailFile ? (
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="thumbnail"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                    >
                      <UploadIcon className="mr-2 h-4 w-4" />
                      {thumbnailFile ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailChange}
                      disabled={isUploading}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recommended size: 1280x720px (16:9 aspect ratio)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Video details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Details</CardTitle>
                <CardDescription>
                  Add information about your video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title*</Label>
                  <Input
                    id="title"
                    placeholder="Enter video title"
                    disabled={isUploading}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter video description"
                    className="min-h-[100px]"
                    disabled={isUploading}
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseId">Course*</Label>
                  <Select 
                    onValueChange={(value) => {
                      setValue('courseId', value);
                      // Reset section when course changes
                      setValue('sectionId', '');
                    }}
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.courseId && (
                    <p className="text-sm text-destructive">{errors.courseId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectionId">Section*</Label>
                  <Select 
                    onValueChange={(value) => setValue('sectionId', value)}
                    disabled={!selectedCourseId || isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sectionId && (
                    <p className="text-sm text-destructive">{errors.sectionId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="physics, mechanics, jee"
                    disabled={isUploading}
                    {...register('tags')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isFree" 
                      {...register('isFree')}
                      disabled={isUploading}
                    />
                    <Label htmlFor="isFree" className="font-normal">
                      This is a free preview
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="allowDownload" 
                      {...register('allowDownload')}
                      disabled={isUploading}
                    />
                    <Label htmlFor="allowDownload" className="font-normal">
                      Allow video download
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/content/videos')}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
