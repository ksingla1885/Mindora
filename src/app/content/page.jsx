'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiPlus, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import ContentList from '@/components/content/ContentList';
import ContentUpload from '@/components/content/ContentUpload';

const ContentPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    topic: '',
    classLevel: searchParams.get('class') || '',
  });
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch topics for the filter dropdown
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics');
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopics();
  }, []);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', { searchQuery, filters });
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      type: '',
      topic: '',
      classLevel: searchParams.get('class') || '',
    });
    setSearchQuery('');
  };
  
  const handleUploadComplete = () => {
    setShowUpload(false);
    // Refresh content list or show success message
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Content Library</h1>
        {session?.user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Upload Content
          </button>
        )}
      </div>
      
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search content..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <FiFilter className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-600 mr-2">Filters:</span>
            </div>
            
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="summary">Summary</option>
              <option value="formula_sheet">Formula Sheet</option>
              <option value="practice_question">Practice Question</option>
            </select>
            
            <select
              name="topic"
              value={filters.topic}
              onChange={handleFilterChange}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            
            <select
              name="classLevel"
              value={filters.classLevel}
              onChange={handleFilterChange}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            
            {(filters.type || filters.topic || filters.classLevel) && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <FiX className="mr-1" /> Clear filters
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Content List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <ContentList 
          topicId={filters.topic} 
          classLevel={filters.classLevel} 
          isAdmin={session?.user?.role === 'ADMIN'} 
        />
      </div>
      
      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">Upload New Content</h2>
              <button 
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <ContentUpload 
                onUploadComplete={handleUploadComplete} 
                topicId={filters.topic || ''}
                classLevel={filters.classLevel || ''}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPage;
