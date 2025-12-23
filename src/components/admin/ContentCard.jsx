'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiEye, FiLink, FiClock, FiLock } from 'react-icons/fi';
import { format } from 'date-fns';

const ContentCard = ({ content, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete(content.id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const getContentTypeIcon = () => {
    switch(content.type) {
      case 'video':
        return <FiLink className="text-blue-500" />;
      case 'document':
        return <FiLink className="text-green-500" />;
      case 'quiz':
        return <FiLink className="text-purple-500" />;
      default:
        return <FiLink className="text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch(content.status) {
      case 'published':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Published
          </span>
        );
      case 'draft':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Thumbnail/Preview */}
      <div className="relative h-40 bg-gray-100 flex items-center justify-center">
        {content.thumbnailUrl ? (
          <img 
            src={content.thumbnailUrl} 
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400">
            {getContentTypeIcon()}
          </div>
        )}
        
        {/* Premium Badge */}
        {!content.isFree && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <FiLock className="mr-1" size={10} />
            Premium
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute bottom-2 left-2">
          {getStatusBadge()}
        </div>
        
        {/* Duration for videos */}
        {content.type === 'video' && content.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {content.duration}
          </div>
        )}
      </div>
      
      {/* Content Details */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 h-12">
            {content.title}
          </h3>
          <div className="flex space-x-1">
            <Link 
              href={`/admin/content/edit/${content.id}`}
              className="text-gray-500 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50"
              title="Edit"
            >
              <FiEdit2 size={16} />
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`p-1 rounded-full ${showConfirm ? 'text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
              title={showConfirm ? 'Confirm Delete' : 'Delete'}
            >
              {isDeleting ? (
                <span className="animate-pulse">...</span>
              ) : showConfirm ? (
                <span>✓</span>
              ) : (
                <FiTrash2 size={16} />
              )}
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">
          {content.description || 'No description'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
          <div className="flex items-center">
            <FiClock className="mr-1" size={12} />
            <span>{format(new Date(content.createdAt), 'MMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
              content.type === 'video' ? 'bg-blue-500' : 
              content.type === 'document' ? 'bg-green-500' : 'bg-purple-500'
            }`}></span>
            <span className="capitalize">{content.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
