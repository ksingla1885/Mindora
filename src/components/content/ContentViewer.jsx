'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Dynamically import PDF viewer with SSR disabled
const PDFViewer = dynamic(
  () => import('@/components/content/PDFViewer'),
  { ssr: false }
);

// Dynamically import video player
const VideoPlayer = dynamic(
  () => import('@/components/content/VideoPlayer'),
  { ssr: false }
);

// Dynamically import markdown viewer
const MarkdownViewer = dynamic(
  () => import('@/components/content/MarkdownViewer'),
  { ssr: false }
);

const ContentViewer = ({ content, className = '' }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!content) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (content.type) {
      case 'pdf':
        return <PDFViewer url={content.url} />;
      case 'video':
        return <VideoPlayer url={content.url} provider={content.provider} />;
      case 'summary':
      case 'formula':
        return <MarkdownViewer content={content.description || content.formulaSheet} />;
      default:
        return (
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-gray-600">Unsupported content type: {content.type}</p>
            <a 
              href={content.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Open in new tab
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
        {content.description && content.type !== 'summary' && content.type !== 'formula' && (
          <p className="mt-1 text-sm text-gray-600">{content.description}</p>
        )}
      </div>
      <div className="p-4">
        {isMounted ? renderContent() : (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">Loading content...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentViewer;
