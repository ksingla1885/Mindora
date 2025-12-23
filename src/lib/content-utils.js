// Content type configurations
export const CONTENT_TYPES = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  QUIZ: 'quiz',
  EXERCISE: 'exercise',
  SUMMARY: 'summary'
};

// Status configurations
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// File type validation
export const ALLOWED_FILE_TYPES = {
  [CONTENT_TYPES.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [CONTENT_TYPES.DOCUMENT]: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  [CONTENT_TYPES.QUIZ]: ['application/json'],
  [CONTENT_TYPES.EXERCISE]: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  [CONTENT_TYPES.SUMMARY]: ['text/plain', 'text/markdown']
};

// Max file sizes in bytes (50MB for videos, 10MB for others)
export const MAX_FILE_SIZES = {
  [CONTENT_TYPES.VIDEO]: 50 * 1024 * 1024,
  [CONTENT_TYPES.DOCUMENT]: 10 * 1024 * 1024,
  [CONTENT_TYPES.QUIZ]: 5 * 1024 * 1024,
  [CONTENT_TYPES.EXERCISE]: 10 * 1024 * 1024,
  [CONTENT_TYPES.SUMMARY]: 2 * 1024 * 1024
};

// Get file type from MIME type
export const getFileType = (mimeType) => {
  if (mimeType.startsWith('video/')) return CONTENT_TYPES.VIDEO;
  if (mimeType === 'application/pdf') return CONTENT_TYPES.DOCUMENT;
  if (mimeType === 'application/json') return CONTENT_TYPES.QUIZ;
  if (mimeType.includes('word') || mimeType.includes('document')) return CONTENT_TYPES.DOCUMENT;
  if (mimeType.startsWith('text/')) return CONTENT_TYPES.SUMMARY;
  return null;
};

// Validate file upload
export const validateFile = (file, contentType) => {
  const fileType = getFileType(file.type);
  
  if (!fileType) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  if (contentType && fileType !== contentType) {
    return { valid: false, error: `File type does not match selected content type (${contentType})` };
  }
  
  if (file.size > (MAX_FILE_SIZES[fileType] || 5 * 1024 * 1024)) {
    const maxSizeMB = Math.ceil((MAX_FILE_SIZES[fileType] || 5 * 1024 * 1024) / (1024 * 1024));
    return { valid: false, error: `File too large. Max size for ${fileType}: ${maxSizeMB}MB` };
  }
  
  return { valid: true, fileType };
};

// Generate content slug
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

// Format content duration (seconds to HH:MM:SS)
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');
};

// Parse duration string (HH:MM:SS) to seconds
export const parseDuration = (duration) => {
  if (!duration) return 0;
  
  const parts = duration.split(':').map(Number);
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS
    seconds = parts[0];
  }
  
  return seconds;
};

// Get content type icon
export const getContentTypeIcon = (type, className = '') => {
  const icons = {
    [CONTENT_TYPES.VIDEO]: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    [CONTENT_TYPES.DOCUMENT]: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    [CONTENT_TYPES.QUIZ]: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    [CONTENT_TYPES.EXERCISE]: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    [CONTENT_TYPES.SUMMARY]: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  };
  
  return icons[type] || icons[CONTENT_TYPES.DOCUMENT];
};
