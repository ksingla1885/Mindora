import { useState } from 'react';
import { useSession } from 'next-auth/react';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const { data: session } = useSession();

  const uploadFile = async (file, metadata) => {
    if (!session) {
      setError('You must be logged in to upload files');
      return { success: false, error: 'Not authenticated' };
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key]);
        }
      });

      // Upload file
      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setUploadedFile(data.data);
      setProgress(100);
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      return { success: false, error: err.message };
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setProgress(0);
    setError(null);
  };

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    uploadedFile,
    resetUpload,
  };
};

export default useFileUpload;
