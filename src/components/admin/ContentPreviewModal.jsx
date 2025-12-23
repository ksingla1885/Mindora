'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getContentTypeIcon } from '@/lib/content-utils';

const ContentPreviewModal = ({ 
  isOpen, 
  onClose, 
  contentItems = [], 
  initialIndex = 0 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const currentItem = contentItems[currentIndex];
  const hasMultipleItems = contentItems.length > 1;
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleItems) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && hasMultipleItems) {
        goToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, hasMultipleItems, onClose]);
  
  // Reset index when opening with new content
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex < contentItems.length - 1 ? prevIndex + 1 : 0
    );
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : contentItems.length - 1
    );
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.log);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  if (!isOpen || !currentItem) return null;
  
  const renderContent = () => {
    if (!currentItem) return null;
    
    const { type, url, content } = currentItem;
    
    switch (type) {
      case 'video':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video 
              src={url} 
              controls 
              className="max-w-full max-h-full"
              autoPlay
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
        
      case 'document':
        return (
          <iframe 
            src={`${url}#toolbar=0&navpanes=0`} 
            className="w-full h-full border-0"
            title="Document Preview"
          />
        );
        
      case 'text':
        return (
          <div className="p-6 overflow-auto">
            <pre className="whitespace-pre-wrap font-sans">{content}</pre>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">
              {getContentTypeIcon(type, 'h-16 w-16 mx-auto text-gray-300')}
            </div>
            <p className="text-lg">Preview not available for this content type</p>
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 text-indigo-600 hover:text-indigo-800"
              >
                Open in new tab
              </a>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${isFullscreen ? 'bg-white' : 'bg-black bg-opacity-75'}`}>
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 ${isFullscreen ? 'bg-white border-b' : 'bg-black bg-opacity-90 text-white'}`}>
        <div className="flex items-center space-x-4">
          {hasMultipleItems && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={goToPrevious}
                className="p-1 rounded-full hover:bg-gray-200 hover:bg-opacity-20"
                aria-label="Previous"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm">
                {currentIndex + 1} / {contentItems.length}
              </span>
              <button 
                onClick={goToNext}
                className="p-1 rounded-full hover:bg-gray-200 hover:bg-opacity-20"
                aria-label="Next"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          
          <h3 className="text-sm font-medium truncate max-w-xs">
            {currentItem.title || 'Untitled Content'}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-gray-200 hover:bg-opacity-20"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0-4h-4m4 0l-5 5" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-200 hover:bg-opacity-20"
            aria-label="Close preview"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="absolute inset-0 pt-14">
        {renderContent()}
      </div>
      
      {/* Navigation Arrows (for large screens) */}
      {hasMultipleItems && !isFullscreen && (
        <>
          <button
            onClick={goToPrevious}
            className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none"
            aria-label="Previous item"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none"
            aria-label="Next item"
          >
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
};

export default ContentPreviewModal;
