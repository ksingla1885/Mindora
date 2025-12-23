import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useFileUpload from '@/hooks/useFileUpload';

const ContentUploadForm = ({ onSuccess, initialData }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { uploadFile, isUploading, progress, error, uploadedFile } = useFileUpload();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topicId: '',
    contentType: 'document',
    isFree: true,
    duration: '',
    thumbnailUrl: '',
  });
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load topics for the dropdown
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch('/api/topics');
        const data = await res.json();
        if (res.ok) {
          setTopics(data);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      }
    };
    
    fetchTopics();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview('');
      }
      
      // Auto-set title if not set
      if (!formData.title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({
          ...prev,
          title: fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file to upload');
      return;
    }
    
    if (!formData.topicId) {
      alert('Please select a topic');
      return;
    }
    
    try {
      const result = await uploadFile(file, {
        ...formData,
        duration: formData.duration || undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
      });
      
      if (result.success) {
        alert('Content uploaded successfully!');
        if (onSuccess) {
          onSuccess(result.data);
        }
        // Reset form
        setFile(null);
        setPreview('');
        setFormData({
          title: '',
          description: '',
          topicId: '',
          contentType: 'document',
          isFree: true,
          duration: '',
          thumbnailUrl: '',
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Upload New Content</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            File <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center justify-center px-6 pt-5 pb-6 mt-1 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400"
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
                  htmlFor="file-upload"
                  className="relative font-medium text-indigo-600 bg-white rounded-md cursor-pointer hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.mp4,.mov,.avi,.wmv,.jpg,.jpeg,.png,.gif,.md,.txt"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, MP4, MOV, AVI, WMV, JPG, PNG, GIF, MD, TXT up to 50MB
              </p>
            </div>
          </div>
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          )}
          {preview && (
            <div className="mt-2">
              <img src={preview} alt="Preview" className="max-w-xs rounded-md" />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
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
            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Topic */}
          <div>
            <label htmlFor="topicId" className="block text-sm font-medium text-gray-700">
              Topic <span className="text-red-500">*</span>
            </label>
            <select
              id="topicId"
              name="topicId"
              required
              value={formData.topicId}
              onChange={handleChange}
              className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.subject?.name} - {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
              Content Type
            </label>
            <select
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleChange}
              className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="exercise">Exercise</option>
              <option value="quiz">Quiz</option>
              <option value="summary">Summary</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Duration (for videos) */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              id="duration"
              min="1"
              value={formData.duration}
              onChange={handleChange}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700">
              Thumbnail URL (optional)
            </label>
            <input
              type="url"
              name="thumbnailUrl"
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://example.com/thumbnail.jpg"
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Is Free */}
        <div className="flex items-center">
          <input
            id="isFree"
            name="isFree"
            type="checkbox"
            checked={formData.isFree}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isFree" className="block ml-2 text-sm text-gray-700">
            This content is free to access
          </label>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Content'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentUploadForm;
