'use client';

import { useState, useTransition } from 'react';
import { FiTrash2, FiArchive, FiUpload, FiDownload, FiCopy, FiTag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { CONTENT_STATUS } from '@/lib/content-utils';

export default function ContentBulkActions({ 
  selectedItems = [], 
  onActionComplete,
  disabled = false
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const selectedCount = selectedItems.length;
  const selectedIds = selectedItems.map(item => item.id);
  
  const handleBulkAction = async (action) => {
    if (selectedCount === 0) return;
    
    const actions = {
      delete: async () => {
        const confirmed = confirm(`Are you sure you want to delete ${selectedCount} item(s)? This action cannot be undone.`);
        if (!confirmed) return;
        
        try {
          const response = await fetch('/api/content/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          
          if (!response.ok) throw new Error('Failed to delete items');
          
          toast.success(`Successfully deleted ${selectedCount} item(s)`);
          onActionComplete?.('delete');
        } catch (error) {
          console.error('Bulk delete error:', error);
          toast.error('Failed to delete items');
        }
      },
      
      archive: async () => {
        try {
          const response = await fetch('/api/content/bulk', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ids: selectedIds, 
              data: { status: CONTENT_STATUS.ARCHIVED }
            })
          });
          
          if (!response.ok) throw new Error('Failed to archive items');
          
          toast.success(`Archived ${selectedCount} item(s)`);
          onActionComplete?.('archive');
        } catch (error) {
          console.error('Bulk archive error:', error);
          toast.error('Failed to archive items');
        }
      },
      
      publish: async () => {
        try {
          const response = await fetch('/api/content/bulk', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ids: selectedIds, 
              data: { status: CONTENT_STATUS.PUBLISHED }
            })
          });
          
          if (!response.ok) throw new Error('Failed to publish items');
          
          toast.success(`Published ${selectedCount} item(s)`);
          onActionComplete?.('publish');
        } catch (error) {
          console.error('Bulk publish error:', error);
          toast.error('Failed to publish items');
        }
      },
      
      export: async () => {
        try {
          // In a real app, this would trigger a file download
          const response = await fetch('/api/content/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          
          if (!response.ok) throw new Error('Failed to export items');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `content-export-${new Date().toISOString().slice(0, 10)}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          
          toast.success(`Exported ${selectedCount} item(s)`);
        } catch (error) {
          console.error('Export error:', error);
          toast.error('Failed to export items');
        }
      },
      
      duplicate: async () => {
        try {
          const response = await fetch('/api/content/duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          
          if (!response.ok) throw new Error('Failed to duplicate items');
          
          const result = await response.json();
          toast.success(`Duplicated ${result.count} item(s)`);
          onActionComplete?.('duplicate');
        } catch (error) {
          console.error('Duplicate error:', error);
          toast.error('Failed to duplicate items');
        }
      },
      
      tag: async () => {
        // This would open a modal to add/remove tags in a real implementation
        const tag = prompt('Enter tag to add to all selected items:');
        if (!tag) return;
        
        try {
          const response = await fetch('/api/content/bulk', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ids: selectedIds, 
              data: { 
                tags: { 
                  push: [tag.trim()] 
                } 
              }
            })
          });
          
          if (!response.ok) throw new Error('Failed to add tag');
          
          toast.success(`Added tag to ${selectedCount} item(s)`);
          onActionComplete?.('tag');
        } catch (error) {
          console.error('Tag error:', error);
          toast.error('Failed to add tag');
        }
      }
    };
    
    if (actions[action]) {
      startTransition(async () => {
        await actions[action]();
      });
    }
    
    setIsDropdownOpen(false);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">
          {selectedCount} selected
        </span>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled || isPending}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bulk Actions
            <svg className="-mr-1 ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                >
                  <FiUpload className="mr-3 h-5 w-5 text-gray-400" />
                  Publish
                </button>
                
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                >
                  <FiArchive className="mr-3 h-5 w-5 text-gray-400" />
                  Archive
                </button>
                
                <button
                  onClick={() => handleBulkAction('tag')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                >
                  <FiTag className="mr-3 h-5 w-5 text-gray-400" />
                  Add Tag
                </button>
                
                <button
                  onClick={() => handleBulkAction('duplicate')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                >
                  <FiCopy className="mr-3 h-5 w-5 text-gray-400" />
                  Duplicate
                </button>
                
                <button
                  onClick={() => handleBulkAction('export')}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                  role="menuitem"
                >
                  <FiDownload className="mr-3 h-5 w-5 text-gray-400" />
                  Export
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  role="menuitem"
                >
                  <FiTrash2 className="mr-3 h-5 w-5 text-red-400" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => onActionComplete?.('clear')}
          className="text-sm text-gray-500 hover:text-gray-700"
          disabled={disabled || isPending}
        >
          Clear selection
        </button>
      </div>
      
      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
