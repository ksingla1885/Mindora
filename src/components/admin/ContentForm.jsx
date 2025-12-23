'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX, FiLink, FiYoutube } from 'react-icons/fi';

export default function ContentForm({ content = null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    subjectId: '',
    topicId: '',
    contentUrl: '',
    thumbnailUrl: '',
    duration: '',
    difficulty: 'beginner',
    status: 'draft',
    isPremium: false,
    tags: '',
    // Add more fields as needed
  });

  // If editing, populate form with existing content
  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        description: content.description || '',
        type: content.type || 'document',
        subjectId: content.subjectId || '',
        topicId: content.topicId || '',
        contentUrl: content.contentUrl || '',
        thumbnailUrl: content.thumbnailUrl || '',
        duration: content.duration || '',
        difficulty: content.difficulty || 'beginner',
        status: content.status || 'draft',
        isPremium: content.isPremium || false,
        tags: content.tags ? content.tags.join(', ') : '',
      });
      
      if (content.thumbnailUrl) {
        setPreviewUrl(content.thumbnailUrl);
      }
    }
  }, [content]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files && files[0]) {
        const file = files[0];
        setFile(file);
        // Create a preview URL for the file
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
        
        // Update form data with file name (in a real app, you'd upload this to a server)
        setFormData(prev => ({
          ...prev,
          thumbnailFile: file,
        }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags' && typeof value === 'string') {
          // Convert comma-separated tags to array
          const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag);
          formDataToSend.append(key, JSON.stringify(tagsArray));
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Append file if it exists
      if (file) {
        formDataToSend.append('file', file);
      }

      const url = content 
        ? `/api/admin/content/${content.id}`
        : '/api/admin/content';
      
      const method = content ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
        // Don't set Content-Type header when using FormData,
        // the browser will set it with the correct boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Redirect to content list or show success message
      router.push('/admin/content');
      router.refresh();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to save content. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {content ? 'Edit Content' : 'Add New Content'}
        </h3>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          {/* Content Title */}
          <div className="sm:col-span-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Content Type */}
          <div className="sm:col-span-3">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Content Type *
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
              <option value="exercise">Exercise</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          {/* Status */}
          <div className="sm:col-span-3">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <select
              id="status"
              name="status"
              required
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Content URL or Upload */}
          {formData.type === 'video' ? (
            <div className="sm:col-span-6">
              <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700">
                Video URL (YouTube/Vimeo) *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <FiYoutube className="h-5 w-5 text-red-600" />
                </span>
                <input
                  type="url"
                  name="contentUrl"
                  id="contentUrl"
                  required
                  value={formData.contentUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                />
              </div>
            </div>
          ) : (
            <div className="sm:col-span-6">
              <label htmlFor="contentFile" className="block text-sm font-medium text-gray-700">
                {formData.type === 'document' ? 'Document File' : 'Content File'} *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="contentFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="contentFile"
                        name="contentFile"
                        type="file"
                        className="sr-only"
                        onChange={handleChange}
                        accept={
                          formData.type === 'document' 
                            ? '.pdf,.doc,.docx,.txt' 
                            : formData.type === 'quiz' 
                              ? '.json,.csv' 
                              : '*/*'
                        }
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formData.type === 'document' 
                      ? 'PDF, DOC, DOCX, TXT up to 10MB' 
                      : formData.type === 'quiz' 
                        ? 'JSON or CSV file with questions' 
                        : 'File appropriate for the content type'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail Upload */}
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">
              Thumbnail
            </label>
            <div className="mt-2 flex items-center">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Thumbnail preview"
                    className="h-20 w-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl('');
                      setFile(null);
                      setFormData(prev => ({
                        ...prev,
                        thumbnailUrl: '',
                        thumbnailFile: null,
                      }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex-shrink-0 h-20 w-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                  <FiImage className="h-10 w-10" />
                </div>
              )}
              <div className="ml-4">
                <label
                  htmlFor="thumbnail"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a thumbnail</span>
                  <input
                    id="thumbnail"
                    name="thumbnail"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleChange}
                  />
                </label>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
              </div>
            </div>
          </div>

          {/* Subject and Topic */}
          <div className="sm:col-span-3">
            <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <select
              id="subjectId"
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a subject</option>
              {/* These would be fetched from the API in a real app */}
              <option value="math">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="topicId" className="block text-sm font-medium text-gray-700">
              Topic (optional)
            </label>
            <select
              id="topicId"
              name="topicId"
              value={formData.topicId}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={!formData.subjectId}
            >
              <option value="">Select a topic</option>
              {/* These would be fetched based on the selected subject */}
              {formData.subjectId === 'math' && (
                <>
                  <option value="algebra">Algebra</option>
                  <option value="geometry">Geometry</option>
                  <option value="calculus">Calculus</option>
                </>
              )}
              {formData.subjectId === 'physics' && (
                <>
                  <option value="mechanics">Mechanics</option>
                  <option value="electricity">Electricity</option>
                  <option value="optics">Optics</option>
                </>
              )}
            </select>
          </div>

          {/* Difficulty */}
          <div className="sm:col-span-3">
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Premium Toggle */}
          <div className="sm:col-span-3 flex items-end">
            <div className="flex items-center h-5">
              <input
                id="isPremium"
                name="isPremium"
                type="checkbox"
                checked={formData.isPremium}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isPremium" className="font-medium text-gray-700">
                Premium Content
              </label>
              <p className="text-gray-500">Requires subscription</p>
            </div>
          </div>

          {/* Tags */}
          <div className="sm:col-span-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="tags"
                id="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="tag1, tag2, tag3"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Separate tags with commas
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin/content')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {content ? 'Updating...' : 'Creating...'}
                </>
              ) : content ? 'Update Content' : 'Create Content'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Helper component for the image icon
function FiImage(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );
}
