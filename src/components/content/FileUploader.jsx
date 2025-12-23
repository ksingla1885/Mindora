'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Image, Video, FileText, FileArchive, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

const ALLOWED_EXTENSIONS = {
  // Video
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-ms-wmv': 'wmv',
  
  // Documents
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'application/json': 'json',
  
  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  
  // Archives
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'application/x-7z-compressed': '7z',
  'application/x-tar': 'tar',
  'application/gzip': 'gz',
};

const FileUploader = ({ 
  onUploadComplete,
  className = '',
  accept = Object.keys(ALLOWED_EXTENSIONS).join(','),
  multiple = true,
  maxFiles = 10,
  maxSize = MAX_FILE_SIZE,
  chunkSize = CHUNK_SIZE,
  uploadUrl = '/api/content/upload',
  headers = {},
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (fileType === 'application/pdf') return <FileText className="w-5 h-5" />;
    if (fileType.includes('word') || fileType.includes('excel') || fileType.includes('powerpoint')) 
      return <FileText className="w-5 h-5" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) 
      return <FileArchive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const validateFiles = (filesToValidate) => {
    const validatedFiles = [];
    const errors = [];

    Array.from(filesToValidate).forEach((file, index) => {
      // Check file type
      if (!ALLOWED_EXTENSIONS[file.type]) {
        errors.push(`File type not supported: ${file.name}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`File too large (max ${formatFileSize(maxSize)}): ${file.name}`);
        return;
      }

      // Check total files count
      if (validatedFiles.length + files.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      validatedFiles.push(file);
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    return validatedFiles;
  };

  const handleFiles = (filesToAdd) => {
    const validFiles = validateFiles(filesToAdd);
    if (validFiles && validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        status: 'pending',
        progress: 0,
        error: null,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (fileObj) => {
    const { id, file } = fileObj;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = files
      .filter(file => file.status === 'pending' || file.status === 'error')
      .map(async (fileObj) => {
        try {
          // Update file status to uploading
          setFiles(prev =>
            prev.map(f =>
              f.id === fileObj.id
                ? { ...f, status: 'uploading', error: null }
                : f
            )
          );

          const result = await uploadFile(fileObj);
          
          // Update file status to completed
          setFiles(prev =>
            prev.map(f =>
              f.id === fileObj.id
                ? { ...f, status: 'completed', progress: 100, result }
                : f
            )
          );

          return { ...fileObj, status: 'completed', result };
        } catch (error) {
          console.error(`Error uploading ${fileObj.file.name}:`, error);
          setFiles(prev =>
            prev.map(f =>
              f.id === fileObj.id
                ? { ...f, status: 'error', error: error.message }
                : f
            )
          );
          return { ...fileObj, status: 'error', error };
        }
      });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(r => r.status === 'completed');
      
      if (successfulUploads.length > 0) {
        toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
        if (onUploadComplete) {
          onUploadComplete(successfulUploads);
        }
      }
    } catch (error) {
      console.error('Error during uploads:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'uploading':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Object.values(ALLOWED_EXTENSIONS).join(', ').toUpperCase()} (Max {formatFileSize(maxSize)} per file)
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">
              {files.filter(f => f.status === 'completed').length} of {files.length} files uploaded
            </h3>
            <Button
              onClick={uploadFiles}
              disabled={isUploading || files.every(f => f.status === 'completed')}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload All'
              )}
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {fileObj.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        getFileIcon(fileObj.file.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.file.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(fileObj.file.size)}</span>
                        <span className="mx-2">•</span>
                        <span className={getStatusColor(fileObj.status)}>
                          {fileObj.status.charAt(0).toUpperCase() + fileObj.status.slice(1)}
                        </span>
                        {fileObj.error && (
                          <span className="text-red-500 ml-2 truncate">
                            {fileObj.error}
                          </span>
                        )}
                      </div>
                      {fileObj.status === 'uploading' && (
                        <Progress
                          value={fileObj.progress}
                          className="h-1.5 mt-2"
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileObj.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
