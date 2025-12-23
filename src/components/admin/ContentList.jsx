'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiSearch, FiPlus, FiCheck, FiX, FiSliders, FiDownload } from 'react-icons/fi';
import Link from 'next/link';
import ContentPreview from './ContentPreview';

export default function ContentList({ initialContent = [] }) {
  // State management
  const [content, setContent] = useState(initialContent);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    subject: '',
    status: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);

  // Toggle select all items
  const toggleSelectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(content.map(item => item.id));
    }
    setIsSelectAll(!isSelectAll);
  }, [isSelectAll, content]);
  
  // Toggle single item selection
  const toggleSelectItem = useCallback((id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  }, []);
  
  // Handle bulk status update
  const handleBulkStatusUpdate = useCallback(async (status) => {
    if (!selectedItems.length) return;
    
    if (confirm(`Are you sure you want to update ${selectedItems.length} item(s) to ${status}?`)) {
      try {
        const response = await fetch('/api/admin/content/bulk-update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedItems, status }),
        });
        
        if (response.ok) {
          await fetchContent();
          setSelectedItems([]);
          setIsSelectAll(false);
        }
      } catch (error) {
        console.error('Error updating content status:', error);
      }
    }
  }, [selectedItems]);
  
  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (!selectedItems.length) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      try {
        const response = await fetch('/api/admin/content/bulk-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedItems }),
        });
        
        if (response.ok) {
          await fetchContent();
          setSelectedItems([]);
          setIsSelectAll(false);
        }
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  }, [selectedItems]);

  // Fetch content with filters and pagination
  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: itemsPerPage,
        search: searchTerm,
        ...filters,
      });

      const res = await fetch(`/api/admin/content?${queryParams}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const { data, total } = await res.json();
      setContent(data);
      setTotalItems(total || 0);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, itemsPerPage, searchTerm, filters]);

  // Handle individual content deletion
  const handleDelete = useCallback(async (id) => {
    if (confirm('Are you sure you want to delete this content item?')) {
      try {
        const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
        if (res.ok) await fetchContent();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  }, [fetchContent]);

  // Get content type badge styling
  const getContentTypeBadge = (type) => {
    const typeMap = {
      video: { bg: 'bg-blue-100', text: 'text-blue-800' },
      document: { bg: 'bg-green-100', text: 'text-green-800' },
      exercise: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      quiz: { bg: 'bg-purple-100', text: 'text-purple-800' },
      summary: { bg: 'bg-pink-100', text: 'text-pink-800' },
      default: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    
    const { bg, text } = typeMap[type] || typeMap.default;
    const displayName = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'N/A';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {displayName}
      </span>
    );
  };

  // Effect to fetch content when dependencies change
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Calculate pagination values
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Content Preview Modal */}
      <ContentPreview 
        content={previewContent} 
        onClose={() => setPreviewContent(null)} 
      />

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-blue-700">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusUpdate('published')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiCheck className="mr-1.5 h-4 w-4" /> Publish
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('draft')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiX className="mr-1.5 h-4 w-4" /> Unpublish
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiTrash2 className="mr-1.5 h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 md:mb-0">
              Content Library
            </h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  showFilters ? 'bg-gray-100' : ''
                }`}
              >
                <FiSliders className="mr-2 h-4 w-4" />
                Filters
              </button>
              <Link
                href="/admin/content/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="-ml-1 mr-2 h-4 w-4" />
                Add Content
              </Link>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="exercise">Exercise</option>
                  <option value="quiz">Quiz</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filters.subject}
                  onChange={(e) => setFilters({...filters, subject: e.target.value})}
                >
                  <option value="">All Subjects</option>
                  <option value="physics">Physics</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                  <option value="astronomy">Astronomy</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                  checked={isSelectAll}
                  onChange={toggleSelectAll}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : content.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No content found. Try adjusting your filters or add new content.
                </td>
              </tr>
            ) : (
              content.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                return (
                  <tr 
                    key={item.id} 
                    className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => setPreviewContent(item)}
                  >
                    <td className="relative w-12 px-6 sm:w-16 sm:px-8" onClick={(e) => e.stopPropagation()}>
                      {isSelected && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-600"></div>
                      )}
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 mr-3">
                          {item.type === 'video' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {item.type === 'document' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {item.type === 'quiz' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">
                            {item.description ? `${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}` : 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getContentTypeBadge(item.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.subject?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'draft' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setPreviewContent(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Preview"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <Link
                          href={`/admin/content/edit/${item.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                        {item.contentUrl && (
                          <a
                            href={item.contentUrl}
                            download
                            className="text-gray-600 hover:text-gray-900"
                            title="Download"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FiDownload className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span>{' '}
              of <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}