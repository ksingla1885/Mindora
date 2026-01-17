'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, X, FileText, Video, Image, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const ALLOWED_FILE_TYPES = {
    'application/pdf': 'PDF Document',
    'video/mp4': 'MP4 Video',
    'video/quicktime': 'QuickTime Video',
    'video/x-msvideo': 'AVI Video',
    'video/x-ms-wmv': 'WMV Video',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'text/markdown': 'Markdown',
    'text/plain': 'Text File',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 50MB

export function ContentUploadForm({
    topics = [],
    olympiads = [],
    subjects = [],
    onSuccess,
    initialData = null,
    onCancel
}) {
    const isEditMode = Boolean(initialData);
    const router = useRouter();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(initialData?.thumbnailUrl || null);
    const [errors, setErrors] = useState({});
    const [selectedSubject, setSelectedSubject] = useState('');
    const [availableTopics, setAvailableTopics] = useState(topics);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        topicId: initialData?.topicId || '',
        subjectId: initialData?.subjectId || '',
        olympiadId: initialData?.olympiadId || '',
        classLevel: initialData?.classLevel?.toString() || '9',
        isPremium: initialData?.isPremium ? 'true' : 'false',
        isPublished: initialData?.isPublished || false,
        tags: initialData?.tags?.join(', ') || '',
        difficulty: initialData?.difficulty || 'medium',
        durationMinutes: initialData?.durationMinutes?.toString() || '0',
        thumbnailFile: null,
    });

    // Update available topics when subject or class changes
    useEffect(() => {
        let filtered = topics;
        if (formData.subjectId) {
            filtered = filtered.filter(topic => topic.subjectId === formData.subjectId);
        }
        if (formData.classLevel) {
            // Accepts classLevel as string, topic.classLevel may be string or number
            filtered = filtered.filter(topic => {
                // Accepts topic.classLevel as string, number, or array
                if (Array.isArray(topic.classLevel)) {
                    return topic.classLevel.includes(formData.classLevel) || topic.classLevel.includes(Number(formData.classLevel));
                }
                return topic.classLevel == formData.classLevel;
            });
        }
        setAvailableTopics(filtered);

        // Reset topic if it's not in the filtered list
        if (formData.topicId && !filtered.some(t => t.id === formData.topicId)) {
            setFormData(prev => ({ ...prev, topicId: '' }));
        }
    }, [formData.subjectId, formData.classLevel, topics, formData.topicId]);

    // Set initial subject based on topic if in edit mode
    useEffect(() => {
        if (initialData?.topicId && !formData.subjectId) {
            const topic = topics.find(t => t.id === initialData.topicId);
            if (topic) {
                setFormData(prev => ({
                    ...prev,
                    subjectId: topic.subjectId,
                    topicId: initialData.topicId
                }));
            }
        }
    }, [initialData, topics]);

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setErrors(prev => ({ ...prev, file: null }));

        if (rejectedFiles?.length > 0) {
            const rejection = rejectedFiles[0];
            let errorMessage = 'File rejected';

            if (rejection.errors.some(e => e.code === 'file-too-large')) {
                errorMessage = `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`;
            } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
                errorMessage = `Invalid file type. Allowed types: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}`;
            }

            setErrors(prev => ({ ...prev, file: errorMessage }));
            return;
        }

        if (acceptedFiles?.length) {
            const file = acceptedFiles[0];

            // Generate preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => setFilePreview(reader.result);
                reader.readAsDataURL(file);
            }

            setFile(file);
        }
    }, []);

    const handleThumbnailChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, thumbnail: 'Thumbnail must be an image' }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB max for thumbnails
            setErrors(prev => ({ ...prev, thumbnail: 'Thumbnail must be less than 5MB' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            thumbnailFile: file
        }));

        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.topicId) newErrors.topicId = 'Please select a topic';
        if (!formData.subjectId) newErrors.subjectId = 'Please select a subject';
        if (!isEditMode && !file) newErrors.file = 'Please select a file to upload';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: Object.keys(ALLOWED_FILE_TYPES).join(','),
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsUploading(true);
        setErrors({});

        try {
            const formDataToSend = new FormData();

            // Add file if in create mode or if file was changed
            if (!isEditMode || file) {
                formDataToSend.append('file', file);
            }

            // Add thumbnail if provided
            if (formData.thumbnailFile) {
                formDataToSend.append('thumbnail', formData.thumbnailFile);
            }

            // Add other form data
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'thumbnailFile' && value != null) {
                    formDataToSend.append(key, value);
                }
            });

            const url = isEditMode
                ? `/api/content/${initialData.id}`
                : '/api/content';

            const method = isEditMode ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                body: formDataToSend,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save content');
            }

            toast({
                title: isEditMode ? 'Content updated' : 'Content uploaded',
                description: isEditMode
                    ? 'Your changes have been saved.'
                    : 'The content has been successfully uploaded.',
            });

            if (onSuccess) {
                onSuccess(data.content);
            }

            // Reset form if not in edit mode
            if (!isEditMode) {
                setFormData({
                    title: '',
                    description: '',
                    topicId: '',
                    subjectId: '',
                    olympiadId: '',
                    classLevel: '9',
                    isPremium: 'false',
                    isPublished: false,
                    tags: '',
                    difficulty: 'medium',
                    durationMinutes: '0',
                    thumbnailFile: null,
                });
                setFile(null);
                setFilePreview(null);
            }

        } catch (error) {
            console.error('Error saving content:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save content',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const renderFileInfo = () => {
        if (!file && !initialData) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-6">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                        Drag and drop a file here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: {Object.values(ALLOWED_FILE_TYPES).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Max size: {MAX_FILE_SIZE_MB}MB
                    </p>
                </div>
            );
        }

        const currentFile = file || initialData;
        const fileType = file ? file.type.split('/')[0] : currentFile.contentType?.split('/')[0];
        const fileName = file ? file.name : currentFile.originalFilename;
        const fileSize = file ? file.size : currentData.fileSize;

        let icon, bgColor, textColor;

        switch (fileType) {
            case 'application':
                icon = <FileText className="h-8 w-8" />;
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-600';
                break;
            case 'video':
                icon = <Video className="h-8 w-8" />;
                bgColor = 'bg-red-100';
                textColor = 'text-red-600';
                break;
            case 'image':
                icon = <Image className="h-8 w-8" />;
                bgColor = 'bg-green-100';
                textColor = 'text-green-600';
                break;
            default:
                icon = <File className="h-8 w-8" />;
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-600';
        }

        return (
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className={`p-3 rounded-lg ${bgColor} ${textColor}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                        {fileSize ? formatFileSize(fileSize) : 'Size not available'}
                    </p>
                </div>
                {file && (
                    <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <div
                        {...getRootProps()}
                        className={cn(
                            'border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                            'hover:border-primary/50',
                            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                            errors.file ? 'border-destructive' : ''
                        )}
                    >
                        <input {...getInputProps()} />
                        {renderFileInfo()}
                    </div>
                    {errors.file && (
                        <p className="mt-1 text-sm text-destructive">
                            <AlertCircle className="inline h-4 w-4 mr-1" />
                            {errors.file}
                        </p>
                    )}
                </div>

                {/* Thumbnail Upload */}
                <div>
                    <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
                    <div className="mt-1 flex items-center space-x-4">
                        <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                            {filePreview ? (
                                <img
                                    src={filePreview}
                                    alt="Thumbnail preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                    <Image className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div>
                            <Input
                                id="thumbnail"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailChange}
                            />
                            <Label
                                htmlFor="thumbnail"
                                className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
                            >
                                {filePreview ? 'Change thumbnail' : 'Upload thumbnail'}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Recommended size: 800x450px (16:9)
                            </p>
                            {errors.thumbnail && (
                                <p className="mt-1 text-sm text-destructive">
                                    <AlertCircle className="inline h-4 w-4 mr-1" />
                                    {errors.thumbnail}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title <span className="text-destructive">*</span>
                            {errors.title && (
                                <span className="text-destructive text-xs ml-2">
                                    <AlertCircle className="inline h-3 w-3 mr-1" />
                                    {errors.title}
                                </span>
                            )}
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter content title"
                            className={errors.title ? 'border-destructive' : ''}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description
                            <span className="text-muted-foreground text-xs font-normal ml-2">(supports markdown)</span>
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter content description (supports markdown)"
                            rows={4}
                            className="min-h-[120px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjectId">
                                Subject <span className="text-destructive">*</span>
                                {errors.subjectId && (
                                    <span className="text-destructive text-xs ml-2">
                                        <AlertCircle className="inline h-3 w-3 mr-1" />
                                        {errors.subjectId}
                                    </span>
                                )}
                            </Label>
                            <Select
                                value={formData.subjectId}
                                onValueChange={(value) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        subjectId: value,
                                        topicId: '' // Reset topic when subject changes
                                    }))
                                }
                            >
                                <SelectTrigger className={errors.subjectId ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="topicId">
                                Topic <span className="text-destructive">*</span>
                                {errors.topicId && (
                                    <span className="text-destructive text-xs ml-2">
                                        <AlertCircle className="inline h-3 w-3 mr-1" />
                                        {errors.topicId}
                                    </span>
                                )}
                            </Label>
                            <Select
                                value={formData.topicId}
                                onValueChange={(value) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        topicId: value,
                                    }))
                                }
                                disabled={!formData.subjectId}
                            >
                                <SelectTrigger className={errors.topicId ? 'border-destructive' : ''}>
                                    <SelectValue
                                        placeholder={formData.subjectId ? "Select a topic" : "Select a subject first"}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTopics.length > 0 ? (
                                        availableTopics.map((topic) => (
                                            <SelectItem key={topic.id} value={topic.id}>
                                                {topic.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                            No topics found for this subject
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="olympiadId">Olympiad (Optional)</Label>
                            <Select
                                value={formData.olympiadId}
                                onValueChange={(value) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        olympiadId: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an olympiad (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {olympiads.map((olympiad) => (
                                        <SelectItem key={olympiad.id} value={olympiad.id}>
                                            {olympiad.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="classLevel">
                                Class Level <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.classLevel}
                                onValueChange={(value) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        classLevel: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[9, 10, 11, 12].map((grade) => (
                                        <SelectItem key={grade} value={grade.toString()}>
                                            Class {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty Level</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(value) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        difficulty: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="olympiad">Olympiad Level</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                            <Input
                                id="durationMinutes"
                                name="durationMinutes"
                                type="number"
                                min="0"
                                value={formData.durationMinutes}
                                onChange={handleInputChange}
                                placeholder="Estimated duration in minutes"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="isPremium">Access Level</Label>
                            <Select
                                value={formData.isPremium}
                                onValueChange={(value) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        isPremium: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">Free for all users</SelectItem>
                                    <SelectItem value="true">Premium (paid) content</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="Comma-separated tags (e.g., algebra, geometry, trigonometry)"
                        />
                        <p className="text-xs text-muted-foreground">
                            Add relevant tags to help users find this content
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isPublished"
                            checked={formData.isPublished}
                            onCheckedChange={(checked) =>
                                setFormData(prev => ({
                                    ...prev,
                                    isPublished: checked
                                }))
                            }
                        />
                        <Label htmlFor="isPublished" className="text-sm font-medium leading-none">
                            Publish immediately
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isUploading || (!isEditMode && !file)}
                    >
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading
                            ? 'Saving...'
                            : isEditMode
                                ? 'Save Changes'
                                : 'Upload Content'}
                    </Button>
                </div>
            </form>

            {isEditMode && initialData?.createdAt && (
                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                    <p>Created: {new Date(initialData.createdAt).toLocaleString()}</p>
                    <p>Last updated: {new Date(initialData.updatedAt).toLocaleString()}</p>
                </div>
            )}
        </div>
    );
}
