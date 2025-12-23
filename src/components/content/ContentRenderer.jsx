'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  CONTENT_TYPES, 
  getContentType, 
  getYouTubeEmbedUrl, 
  getVimeoEmbedUrl,
  getPdfUrl,
  formatDuration
} from '@/utils/contentUtils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(
  () => import('@/components/content/PDFViewer'),
  { ssr: false, loading: () => <Skeleton className="w-full h-[600px]" /> }
);

const ContentRenderer = ({ content, className = '' }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef(null);
  
  useEffect(() => {
    setIsMounted(true);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  if (!isMounted) {
    return (
      <div className="w-full">
        <Skeleton className="w-full h-8 mb-4" />
        <Skeleton className="w-full h-[600px]" />
      </div>
    );
  }
  
  const contentType = getContentType(content.url, content.mimeType);
  const metadata = content.metadata || {};
  
  const toggleFullscreen = async () => {
    if (!contentRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await contentRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };
  
  const renderContent = () => {
    switch (contentType) {
      case CONTENT_TYPES.YOUTUBE: {
        const embedUrl = getYouTubeEmbedUrl(content.url);
        if (!embedUrl) return <div>Invalid YouTube URL</div>;
        
        return (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={metadata.title || 'YouTube video player'}
            />
          </div>
        );
      }
      
      case CONTENT_TYPES.VIMEO: {
        const embedUrl = getVimeoEmbedUrl(content.url);
        if (!embedUrl) return <div>Invalid Vimeo URL</div>;
        
        return (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={metadata.title || 'Vimeo video player'}
            />
          </div>
        );
      }
      
      case CONTENT_TYPES.PDF:
        return (
          <div className="w-full h-[600px]">
            <PDFViewer 
              url={getPdfUrl(content.url)} 
              title={metadata.title}
            />
          </div>
        );
      
      case CONTENT_TYPES.IMAGE:
        return (
          <div className="flex justify-center">
            <img 
              src={content.url} 
              alt={metadata.title || 'Content image'} 
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        );
      
      case CONTENT_TYPES.FORMULA:
        return (
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div 
              className="text-center text-2xl font-math"
              dangerouslySetInnerHTML={{ __html: content.content || '' }}
            />
          </div>
        );
      
      default:
        return (
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content || 'No content available' }}
          />
        );
    }
  };
  
  const renderMetadata = () => {
    if (Object.keys(metadata).length === 0) return null;
    
    return (
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
        {metadata.description && (
          <p className="text-base">{metadata.description}</p>
        )}
        
        <div className="flex flex-wrap gap-4">
          {metadata.duration > 0 && (
            <span>Duration: {formatDuration(metadata.duration)}</span>
          )}
          
          {metadata.difficulty && (
            <span>Difficulty: <span className="capitalize">{metadata.difficulty}</span></span>
          )}
          
          {metadata.subject && (
            <span>Subject: {metadata.subject}</span>
          )}
          
          {metadata.classLevel && (
            <span>Class: {metadata.classLevel}</span>
          )}
          
          {metadata.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span>Tags: </span>
              {metadata.tags.map((tag, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Card 
      ref={contentRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 m-0 w-screen h-screen' : ''} ${className}`}
    >
      <CardHeader>
        <CardTitle>{metadata.title || 'Content'}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {renderContent()}
          
          {(contentType === CONTENT_TYPES.PDF || contentType === CONTENT_TYPES.IMAGE) && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </button>
          )}
        </div>
        
        {renderMetadata()}
      </CardContent>
    </Card>
  );
};

export default ContentRenderer;
