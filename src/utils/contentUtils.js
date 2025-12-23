import { isValidUrl } from './validation';

export const CONTENT_TYPES = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  PDF: 'pdf',
  IMAGE: 'image',
  TEXT: 'text',
  FORMULA: 'formula',
};

export const getContentType = (url, mimeType) => {
  if (!url) return CONTENT_TYPES.TEXT;
  
  // Check for YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return CONTENT_TYPES.YOUTUBE;
  }
  
  // Check for Vimeo
  if (url.includes('vimeo.com')) {
    return CONTENT_TYPES.VIMEO;
  }
  
  // Check by file extension if no mimeType provided
  const extension = url.split('.').pop().toLowerCase();
  
  // Check for PDF
  if (mimeType?.includes('pdf') || extension === 'pdf') {
    return CONTENT_TYPES.PDF;
  }
  
  // Check for images
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  if (mimeType?.startsWith('image/') || imageExtensions.includes(extension)) {
    return CONTENT_TYPES.IMAGE;
  }
  
  return CONTENT_TYPES.TEXT;
};

export const getYouTubeEmbedUrl = (url) => {
  try {
    const urlObj = new URL(url);
    if (url.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be')) {
      const videoId = urlObj.pathname.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    console.error('Invalid YouTube URL:', e);
  }
  return null;
};

export const getVimeoEmbedUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.pathname.split('/').pop();
    return `https://player.vimeo.com/video/${videoId}`;
  } catch (e) {
    console.error('Invalid Vimeo URL:', e);
    return null;
  }
};

export const getPdfUrl = (url) => {
  // In production, you might want to use signed URLs for S3
  return url;
};

export const extractMetadata = (content) => {
  const metadata = {
    title: content.title || 'Untitled',
    description: content.description || '',
    duration: content.duration || 0,
    difficulty: content.difficulty || 'beginner',
    tags: content.tags || [],
    subject: content.subject || '',
    classLevel: content.classLevel || '',
    thumbnail: content.thumbnail || null,
    createdAt: content.createdAt || new Date().toISOString(),
    updatedAt: content.updatedAt || new Date().toISOString(),
  };
  
  return metadata;
};

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
