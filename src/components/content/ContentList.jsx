'use client';

import { useState, useEffect } from 'react';
import { FiFileText, FiVideo, FiFile, FiDownload, FiTrash2, FiEdit2 } from 'react-icons/fi';

const ContentList = ({ topicId, classLevel, isAdmin = false }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchContent();
  }, [topicId, classLevel]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content?topicId=${topicId}&classLevel=${classLevel}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err.message || 'Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete content');
      }
      
      // Refresh content list
      fetchContent();
    } catch (err) {
      setError(err.message || 'Error deleting content');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      title: item.title,
      description: item.description || ''
    });
  };

  const handleUpdate = async (e, contentId) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      
      setEditingId(null);
      fetchContent();
    } catch (err) {
      setError(err.message || 'Error updating content');
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <FiVideo className="w-5 h-5 text-red-500" />;
      case 'pdf':
        return <FiFileText className="w-5 h-5 text-red-500" />;
      default:
        return <FiFile className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No content available for this topic.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {content.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          {editingId === item.id ? (
            <form onSubmit={(e) => handleUpdate(e, item.id)} className="space-y-3">
              <div>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="2"
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getContentIcon(item.contentType)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-3">
                      <span>{item.contentType}</span>
                      <span>•</span>
                      <span>{formatFileSize(item.fileSize || 0)}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={`/api/content/download/${item.id}`}
                    className="p-2 text-gray-500 hover:text-blue-600"
                    title="Download"
                  >
                    <FiDownload className="w-4 h-4" />
                  </a>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContentList;
