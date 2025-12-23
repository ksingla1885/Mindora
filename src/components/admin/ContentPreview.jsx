'use client';

import { useState, useEffect } from 'react';
import { FiX, FiExternalLink } from 'react-icons/fi';

export default function ContentPreview({ content, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [contentDetails, setContentDetails] = useState(null);

  useEffect(() => {
    const fetchContentDetails = async () => {
      if (!content) return;
      
      try {
        setIsLoading(true);
        const res = await fetch(`/api/content/${content.id}`);
        if (res.ok) {
          const data = await res.json();
          setContentDetails(data);
        }
      } catch (error) {
        console.error('Error fetching content details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentDetails();
  }, [content]);

  if (!content) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!contentDetails) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Unable to load content preview</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{contentDetails.title}</h2>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="capitalize">{contentDetails.type}</span>
            <span className="mx-2">•</span>
            <span>{new Date(contentDetails.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {contentDetails.description && (
          <div className="prose max-w-none">
            <p className="text-gray-700">{contentDetails.description}</p>
          </div>
        )}

        {contentDetails.contentUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Content</h3>
            {contentDetails.type === 'video' ? (
              <div className="aspect-w-16 aspect-h-9">
                <video 
                  src={contentDetails.contentUrl} 
                  controls 
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            ) : contentDetails.type === 'document' ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 font-medium">PDF</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{contentDetails.title}</p>
                    <a 
                      href={contentDetails.contentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      Open document <FiExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <p>{contentDetails.content}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FiX className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Preview Content
              </h3>
              <div className="mt-2 max-h-[70vh] overflow-y-auto">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
