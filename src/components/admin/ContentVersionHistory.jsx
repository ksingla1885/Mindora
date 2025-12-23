'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FiClock, FiUser, FiFileText, FiRotateCcw, FiCheck, FiX } from 'react-icons/fi';

export default function ContentVersionHistory({ contentId, isOpen, onClose }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  
  // Fetch versions when the modal is opened
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchVersions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be an API call to fetch versions
        // const response = await fetch(`/api/content/${contentId}/versions`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockVersions = [
          {
            id: 'v1',
            versionNumber: 1,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            createdBy: { id: '1', name: 'Admin User' },
            changes: 'Initial version',
            content: {
              title: 'Introduction to Physics',
              description: 'Basic concepts of physics',
              // ... other content fields
            }
          },
          {
            id: 'v2',
            versionNumber: 2,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            createdBy: { id: '1', name: 'Admin User' },
            changes: 'Updated content and added examples',
            content: {
              title: 'Introduction to Physics',
              description: 'Basic concepts of physics with practical examples',
              // ... other content fields
            }
          },
          {
            id: 'v3',
            versionNumber: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: { id: '2', name: 'Content Editor' },
            changes: 'Fixed typos and improved formatting',
            content: {
              title: 'Introduction to Physics',
              description: 'Basic concepts of physics with practical examples',
              // ... other content fields
            },
            isCurrent: true
          }
        ];
        
        setVersions(mockVersions);
      } catch (err) {
        console.error('Error fetching versions:', err);
        setError('Failed to load version history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVersions();
  }, [contentId, isOpen]);
  
  const handlePreviewVersion = (version) => {
    setSelectedVersion(version);
    setPreviewContent(version.content);
  };
  
  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    
    const confirmed = confirm('Are you sure you want to restore this version? This will replace the current content.');
    if (!confirmed) return;
    
    setRestoreInProgress(true);
    
    try {
      // In a real app, this would be an API call to restore the version
      // const response = await fetch(`/api/content/${contentId}/restore`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ versionId: selectedVersion.id })
      // });
      // 
      // if (!response.ok) throw new Error('Failed to restore version');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Version restored successfully');
      onClose();
    } catch (err) {
      console.error('Error restoring version:', err);
      alert('Failed to restore version');
    } finally {
      setRestoreInProgress(false);
    }
  };
  
  const formatDate = (dateString) => {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Version History
                </h3>
                
                {error ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiX className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Version List */}
                    <div className="w-full md:w-1/3 border-r border-gray-200 pr-4">
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {versions.map((version, index) => (
                            <li key={version.id}>
                              <div className="relative pb-8">
                                {index !== versions.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${version.isCurrent ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                                      {version.isCurrent ? (
                                        <FiCheck className="h-5 w-5 text-white" />
                                      ) : (
                                        <FiFileText className="h-5 w-5 text-white" />
                                      )}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        {version.changes}
                                      </p>
                                      <div className="mt-1 text-xs text-gray-400 flex items-center">
                                        <FiUser className="mr-1 h-3 w-3" />
                                        {version.createdBy.name}
                                        <FiClock className="ml-2 mr-1 h-3 w-3" />
                                        {formatDate(version.createdAt)}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      <button
                                        onClick={() => handlePreviewVersion(version)}
                                        className="font-medium text-indigo-600 hover:text-indigo-900"
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Preview Pane */}
                    <div className="w-full md:w-2/3">
                      {selectedVersion ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="mb-4">
                            <h4 className="text-lg font-medium text-gray-900">{selectedVersion.content.title}</h4>
                            <p className="text-sm text-gray-500">
                              Version {selectedVersion.versionNumber} • {formatDate(selectedVersion.createdAt)}
                            </p>
                            {selectedVersion.changes && (
                              <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                                <p className="text-sm text-yellow-700">
                                  <span className="font-medium">Changes:</span> {selectedVersion.changes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="border rounded-md p-4 bg-white">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h5>
                            <div className="prose max-w-none">
                              <p>{selectedVersion.content.description || 'No content preview available'}</p>
                              {/* In a real app, you'd render the actual content preview here */}
                            </div>
                          </div>
                          
                          {!selectedVersion.isCurrent && (
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={handleRestoreVersion}
                                disabled={restoreInProgress}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {restoreInProgress ? (
                                  <>
                                    <FiRotateCcw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Restoring...
                                  </>
                                ) : (
                                  'Restore this version'
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500">
                          <FiFileText className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg">Select a version to preview</p>
                          <p className="text-sm mt-1 text-center max-w-md">
                            Click on any version in the list to view its contents and restore if needed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
