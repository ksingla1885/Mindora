'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FiUpload, FiX, FiCheck, FiFile, FiImage, FiFileText, FiAlertCircle, FiVideo, FiRotateCw } from 'react-icons/fi';

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types with their MIME types and extensions
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'text/markdown': 'md',
  'text/plain': 'txt',
};

// Chunk size for file uploads (5MB chunks)
const CHUNK_SIZE = 5 * 1024 * 1024;

const ContentUpload = ({ onUploadComplete, topicId, classLevel }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileError, setFileError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [chunkNumber, setChunkNumber] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const fileInputRef = useRef(null);
  
  // Reset form after successful upload
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
        if (onUploadComplete) {
          setFile(null);
          setTitle('');
          setDescription('');
          setFileError('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }, 5000); // Increased from 3s to 5s for better UX
      return () => clearTimeout(timer);
    }
  }, [success, onUploadComplete]);

  const validateFile = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size (${formatFileSize(file.size)}) exceeds 50MB limit`);
      return false;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
        .map(type => type.split('/')[1])
        .join(', ');
      setFileError(`File type "${file.type}" not supported. Allowed types: ${allowedTypes}`);
      return false;
    }

    setFileError('');
    return true;
  };

  // Create preview URL for images and videos
  const createPreviewUrl = useCallback((file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      return URL.createObjectURL(file);
    }
    return '';
  }, []);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    setError('');
    setSuccess('');
    setRetryCount(0);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setContentType(selectedFile.type.split('/')[0]);
        setPreviewUrl(createPreviewUrl(selectedFile));
        
        if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
        }
        
        // Calculate total chunks
        const chunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
        setTotalChunks(chunks);
        setChunkNumber(0);
      } else {
        // Reset file input if validation fails
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setPreviewUrl('');
      }
    }
  };

  const uploadChunk = async (file, start, end, chunk, isLastChunk) => {
    const chunkData = file.slice(start, end);
    const chunkFormData = new FormData();
    
    chunkFormData.append('file', chunkData, file.name);
    chunkFormData.append('chunkNumber', chunk);
    chunkFormData.append('totalChunks', totalChunks);
    chunkFormData.append('fileName', file.name);
    chunkFormData.append('fileType', file.type);
    chunkFormData.append('fileSize', file.size);
    chunkFormData.append('title', title.trim());
    chunkFormData.append('description', description.trim());
    chunkFormData.append('contentType', contentType);
    chunkFormData.append('topicId', topicId);
    chunkFormData.append('classLevel', classLevel);
    
    if (uploadId) {
      chunkFormData.append('uploadId', uploadId);
    }
    if (isLastChunk) {
      chunkFormData.append('isLastChunk', 'true');
    }

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.open('POST', '/api/content/upload', true);
      
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          if (response.uploadId) {
            setUploadId(response.uploadId);
          }
          resolve(response);
        } else {
          reject(new Error(xhr.statusText || 'Chunk upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during chunk upload'));
      xhr.send(chunkFormData);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }
    
    if (!topicId) {
      setError('Please select a topic');
      return;
    }

    // Re-validate file in case it was changed
    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      // If file is small enough, upload in one go
      if (file.size <= CHUNK_SIZE) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('contentType', contentType);
        formData.append('topicId', topicId);
        formData.append('classLevel', classLevel);
        formData.append('isLastChunk', 'true');

        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        });

        const response = await new Promise((resolve, reject) => {
          xhr.open('POST', '/api/content/upload', true);
          
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.statusText || 'Upload failed'));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        setSuccess('Content uploaded successfully!');
        if (onUploadComplete) {
          onUploadComplete(response);
        }
      } else {
        // Upload in chunks for large files
        let start = 0;
        let chunk = 1;
        let uploadSuccessful = false;
        
        while (start < file.size && !uploadSuccessful) {
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const isLastChunk = end >= file.size;
          
          try {
            setChunkNumber(chunk);
            const response = await uploadChunk(file, start, end, chunk, isLastChunk);
            
            // Update progress
            const newProgress = Math.round((end / file.size) * 100);
            setProgress(newProgress);
            
            if (isLastChunk) {
              uploadSuccessful = true;
              setSuccess('Content uploaded successfully!');
              if (onUploadComplete) {
                onUploadComplete(response);
              }
            }
            
            start = end;
            chunk++;
          } catch (err) {
            console.error('Chunk upload error:', err);
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              setError(`Upload failed (attempt ${retryCount + 1}/3). Retrying...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            } else {
              throw new Error('Failed after multiple retries. Please try again.');
            }
          }
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FiFile className="h-12 w-12 text-gray-400" />;

    const fileType = file.type.split('/')[0];

    // Show preview for images and videos
    if (previewUrl) {
      if (fileType === 'image') {
        return (
          <div className="relative h-32 w-full rounded-md overflow-hidden">
            <img 
              src={previewUrl} 
              alt={file.name}
              className="h-full w-full object-contain"
            />
          </div>
        );
      } else if (fileType === 'video') {
        return (
          <div className="relative h-32 w-full rounded-md overflow-hidden bg-black">
            <video 
              src={previewUrl}
              className="h-full w-full object-contain"
              controls
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    }

    // Fallback to icons for other file types
    switch (fileType) {
      case 'image':
        return <FiImage className="h-12 w-12 text-blue-500" />;
      case 'video':
        return <FiVideo className="h-12 w-12 text-red-500" />;
      case 'application':
        return <FiFileText className="h-12 w-12 text-yellow-500" />;
      default:
        return <FiFile className="h-12 w-12 text-gray-400" />;
    }
  };
  
  const handleRetry = (e) => {
    e.preventDefault();
    setError('');
    setRetryCount(0);
    handleSubmit(e);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Content</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 flex items-start">
          <FiAlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-1 text-sm text-red-700">
              {error}
              {progress > 0 && progress < 100 && ` (Upload was ${progress}% complete)`}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 flex items-start">
          <FiCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <div className="mt-1 text-sm text-green-700">
              {success}
              {progress < 100 && ` (${progress}% uploaded)`}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File <span className="text-red-500">*</span>
          </label>

          <div
            className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-md transition-colors ${
              fileError
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
            }`}
          >
            <div className="space-y-3 text-center">
              {getFileIcon()}
              <div className="flex flex-col sm:flex-row text-sm text-gray-600 items-center justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span className="whitespace-nowrap">Choose a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isUploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, MP4, JPG, PNG up to 50MB
              </p>
              {fileError && (
                <p className="text-xs text-red-500 mt-1">{fileError}</p>
              )}
            </div>
          </div>

          {file && (
            <div className="mt-3 flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div className="flex items-center min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon()}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-500"
                disabled={isUploading}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter content title"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter content description"
          />
        </div>

        <div className="mt-6">
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isUploading || !file}
              className={`flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isUploading || !file
                  ? 'bg-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isUploading ? (
                <>
                  <FiRotateCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  {chunkNumber > 0 ? `Uploading (${chunkNumber}/${totalChunks})...` : 'Uploading...'}
                </>
              ) : (
                'Upload Content'
              )}
            </button>
            
            {error && !isUploading && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiRotateCw className="-ml-1 mr-2 h-4 w-4" />
                Retry
              </button>
            )}
          </div>
        </div>
      </form>
      
    </div>
  );
};

export default ContentUpload;
