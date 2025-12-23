'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function TopicDetailPage() {
  const { topicId } = useParams();
  const router = useRouter();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'formulas', 'practice', 'discussion'
  const [showAddContentForm, setShowAddContentForm] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    type: 'video',
    url: '',
    provider: 's3'
  });
  
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (topicId) {
      fetchTopic();
    }
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/topics/${topicId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch topic');
      }
      
      setTopic(data.data);
    } catch (err) {
      console.error('Error fetching topic:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContent,
          topicId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add content');
      }
      
      // Refresh the topic data
      fetchTopic();
      // Reset form
      setNewContent({
        title: '',
        description: '',
        type: 'video',
        url: '',
        provider: 's3'
      });
      setShowAddContentForm(false);
    } catch (err) {
      console.error('Error adding content:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="mt-2 text-lg text-gray-600">Loading topic details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchTopic}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <div className="mt-4">
            <Link 
              href={`/subjects/${topic?.subjectId || ''}`} 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Subject
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Topic Not Found</h1>
          <p className="text-gray-600">The requested topic could not be found.</p>
          <div className="mt-4">
            <Link 
              href="/subjects" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Subjects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex">
                <Link href="/subjects" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  Subjects
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link 
                  href={`/subjects/${topic.subjectId}`} 
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {topic.subject?.name || 'Subject'}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">
                  {topic.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Topic Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {topic.subject?.name} • {topic.difficulty}
                </p>
              </div>
              {isAdmin && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddContentForm(!showAddContentForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Content
                  </button>
                </div>
              )}
            </div>
            
            {topic.summary && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">Summary</h3>
                <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {topic.summary}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Content Form */}
        {showAddContentForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Content</h2>
            <form onSubmit={handleAddContent}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newContent.title}
                    onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Content Type *
                  </label>
                  <select
                    id="type"
                    value={newContent.type}
                    onChange={(e) => setNewContent({...newContent, type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="summary">Summary</option>
                    <option value="exercise">Exercise</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={newContent.description}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="mt-4">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={newContent.url}
                  onChange={(e) => setNewContent({...newContent, url: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com/video"
                  required
                />
              </div>
              
              <div className="mt-4">
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                  Provider
                </label>
                <select
                  id="provider"
                  value={newContent.provider}
                  onChange={(e) => setNewContent({...newContent, provider: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="s3">S3</option>
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="external">External Link</option>
                </select>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddContentForm(false)}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Content
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Content
              {topic._count?.contentItems > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {topic._count.contentItems}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('formulas')}
              className={`${
                activeTab === 'formulas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Formulas
            </button>
            
            <button
              onClick={() => setActiveTab('practice')}
              className={`${
                activeTab === 'practice'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Practice
              {topic._count?.questions > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {topic._count.questions}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('discussion')}
              className={`${
                activeTab === 'discussion'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Discussion
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          {activeTab === 'content' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Learning Materials</h2>
              
              {topic.contentItems && topic.contentItems.length > 0 ? (
                <div className="space-y-4">
                  {topic.contentItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {item.type === 'video' ? (
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : item.type === 'pdf' ? (
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                          )}
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="capitalize">{item.type}</span>
                            <span className="mx-2">•</span>
                            <span>{item.provider}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {item.type === 'video' ? 'Watch' : item.type === 'pdf' ? 'View PDF' : 'View'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No content</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding content to this topic.
                  </p>
                  {isAdmin && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddContentForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg
                          className="-ml-1 mr-2 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Add Content
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'formulas' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Formulas & Key Concepts</h2>
              
              {topic.formulaSheet ? (
                <div className="prose max-w-none">
                  <div 
                    className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: topic.formulaSheet.replace(/\n/g, '<br />') }}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No formulas added</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isAdmin 
                      ? 'Add key formulas and concepts for this topic.'
                      : 'No formulas have been added for this topic yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'practice' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Practice Questions</h2>
              
              {topic.questions && topic.questions.length > 0 ? (
                <div className="space-y-6">
                  {topic.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-700 font-medium">{index + 1}</span>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-base font-medium text-gray-900">{question.text}</h3>
                          
                          {question.type === 'mcq' && question.options && (
                            <div className="mt-3 space-y-2">
                              {question.options.map((option, i) => (
                                <div key={i} className="flex items-center">
                                  <input
                                    id={`question-${question.id}-option-${i}`}
                                    name={`question-${question.id}`}
                                    type="radio"
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                  />
                                  <label htmlFor={`question-${question.id}-option-${i}`} className="ml-3 block text-sm font-medium text-gray-700">
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === 'short_answer' && (
                            <div className="mt-3">
                              <input
                                type="text"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Your answer..."
                              />
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                              <h4 className="text-sm font-medium text-blue-800">Explanation</h4>
                              <p className="mt-1 text-sm text-blue-700">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Submit Answers
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No practice questions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isAdmin 
                      ? 'Add practice questions to help students master this topic.'
                      : 'No practice questions have been added for this topic yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'discussion' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Discussion</h2>
              
              <div className="mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <form action="#" className="relative">
                      <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <label htmlFor="comment" className="sr-only">
                          Add your question or comment
                        </label>
                        <textarea
                          rows={3}
                          name="comment"
                          id="comment"
                          className="block w-full py-3 border-0 resize-none focus:ring-0 sm:text-sm"
                          placeholder="Add your question or comment..."
                          defaultValue={''}
                        />
                        <div className="py-2 px-3 bg-gray-50 border-t border-gray-200">
                          <div className="flex-shrink-0">
                            <button
                              type="submit"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No discussions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Be the first to start a discussion about this topic.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
