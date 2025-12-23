/**
 * Utility functions for handling video uploads to S3 with progress tracking
 */

export const uploadToS3 = async (file, onProgress) => {
  try {
    // 1. Get presigned URL for upload
    const presignedResponse = await fetch('/api/videos/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: 'videos',
      }),
    });

    if (!presignedResponse.ok) {
      const error = await presignedResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { presignedUrl, fileKey } = await presignedResponse.json();

    // 2. Upload the file using the presigned URL
    const uploadResponse = await uploadWithProgress(
      presignedUrl,
      file,
      onProgress
    );

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    // 3. Return the file key for future reference
    return { fileKey, fileName: file.name };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const uploadWithProgress = (url, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        if (onProgress) onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

export const generateThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.autoplay = true;
    video.muted = true;
    video.src = URL.createObjectURL(videoFile);

    video.onloadeddata = () => {
      // Set canvas dimensions
      const targetWidth = 320;
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = targetWidth;
      canvas.height = targetWidth / aspectRatio;

      // Capture thumbnail at 25% of the video
      video.currentTime = video.duration * 0.25;
    };

    video.onseeked = () => {
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailFile = new File([blob], 'thumbnail.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(thumbnailFile);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.85);
      
      // Clean up
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      resolve(null);
    };
  });
};

export const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
};
