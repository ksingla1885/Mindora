'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX } from 'react-icons/fi';

export default function ContentForm({ content = null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    url: '',
    topicId: '',
    isPublished: false,
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [topics, setTopics] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Fetch topics for the dropdown
    const fetchTopics = async () => {
      try {
        const res = await fetch('/api/topics');
        if (res.ok) {
          const data = await res.json();
          setTopics(data);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      }
    };

    fetchTopics();

    // If editing existing content, populate the form
    if (content) {
      setFormData({
        title: content.title || '',
        description: content.description || '',
        type: content.type || 'video',
        url: content.url || '',
        topicId: content.topicId || '',
        isPublished: content.isPublished || false,
        tags: content.tags || []
      });
    }
  }, [content]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTagChange = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        e.target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let contentUrl = formData.url;
      
      // Handle file upload if a file is selected
      if (file) {
        setIsUploading(true);
        const formDataFile = new FormData();
        formDataFile.append('file', file);
        formDataFile.append('type', formData.type);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataFile,
        });

        if (!uploadRes.ok) {
          throw new Error('File upload failed');
        }

        const uploadData = await uploadRes.json();
        contentUrl = uploadData.url;
        setIsUploading(false);
      }

      // Prepare the final data to submit
      const contentData = {
        ...formData,
        url: contentUrl,
      };

      const method = content ? 'PUT' : 'POST';
      const url = content ? `/api/admin/content/${content.id}` : '/api/admin/content';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      });

      if (!res.ok) {
        throw new Error(content ? 'Failed to update content' : 'Failed to create content');
      }

      router.push('/admin/content');
      router.refresh();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {content ? 'Edit Content' : 'Add New Content'}
      </h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Content Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="article">Article</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>

          <div>
            <label htmlFor="topicId" className="block text-sm font-medium text-gray-700">
              Topic *
            </label>
            <select
              id="topicId"
              name="topicId"
              value={formData.topicId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            {formData.type === 'video' ? 'Video File' : formData.type === 'pdf' ? 'PDF File' : 'File'}
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              accept={formData.type === 'video' ? 'video/*' : formData.type === 'pdf' ? '.pdf' : '*'}
              className="hidden"
            />
            <label
              htmlFor="file"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              <FiUpload className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              {file ? file.name : 'Choose File'}
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="ml-2 text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>
          {isUploading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
          {!file && formData.url && (
            <p className="mt-1 text-sm text-gray-500">
              Current file: <span className="font-medium">{formData.url.split('/').pop()}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            {formData.type === 'video' ? 'Video URL' : 'External URL'}
            <span className="text-gray-400 ml-1">(optional if uploading file)</span>
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com/video"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="mt-1 flex flex-wrap gap-2 items-center">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                >
                  <span className="sr-only">Remove tag</span>
                  <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              id="tags"
              name="tags"
              onKeyDown={handleTagChange}
              placeholder="Add a tag and press Enter"
              className="flex-1 min-w-0 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            checked={formData.isPublished}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
            Publish this content
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/admin/content')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isUploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : content ? (
              'Update Content'
            ) : (
              'Create Content'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
