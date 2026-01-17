
import { useState, useEffect } from 'react';

const ContentUploadForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    topicId: '',
    contentType: 'document',
    isFree: true,
    duration: '',
    thumbnailUrl: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fetch subjects
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setSubjects(result.data);
        } else {
          setSubjects([]);
        }
      } catch (err) {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Fetch all topics
    const fetchTopics = async () => {
      try {
        const res = await fetch('/api/topics');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setTopics(result.data);
        } else {
          setTopics([]);
        }
      } catch (err) {
        setTopics([]);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    // Filter topics by selected subject
    if (formData.subjectId) {
      setFilteredTopics(topics.filter(t => t.subjectId === formData.subjectId));
      // Reset topic if not in filtered list
      if (formData.topicId && !topics.some(t => t.id === formData.topicId && t.subjectId === formData.subjectId)) {
        setFormData(prev => ({ ...prev, topicId: '' }));
      }
    } else {
      setFilteredTopics([]);
      setFormData(prev => ({ ...prev, topicId: '' }));
    }
  }, [formData.subjectId, topics]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview('');
      }
      if (!formData.title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!formData.topicId) {
      setError('Please select a topic');
      return;
    }
    setIsUploading(true);
    setProgress(0);
    try {
      // Simulate upload
      setTimeout(() => setProgress(100), 500);
      setTimeout(() => {
        setIsUploading(false);
        if (onSuccess) onSuccess({ ...formData, file });
        setFormData({
          title: '',
          description: '',
          topicId: '',
          contentType: 'document',
          isFree: true,
          duration: '',
          thumbnailUrl: '',
        });
        setFile(null);
        setPreview('');
      }, 1000);
    } catch (err) {
      setError('Upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Upload New Content</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.mp4,.mov,.avi,.wmv,.jpg,.jpeg,.png,.gif,.md,.txt"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
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

        {/* Subject Dropdown */}
        <div>
          <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            id="subjectId"
            name="subjectId"
            required
            value={formData.subjectId}
            onChange={handleChange}
            className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a subject</option>
            {subjects.length > 0 && subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>

        {/* Topic Dropdown (filtered by subject) */}
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
            disabled={!formData.subjectId}
            className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">{formData.subjectId ? 'Select a topic' : 'Select a subject first'}</option>
            {filteredTopics.length > 0 && filteredTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
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

        {/* Duration */}
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
