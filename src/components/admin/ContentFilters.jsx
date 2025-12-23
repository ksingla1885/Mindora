'use client';

import { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function ContentFilters({ 
  onFilterChange, 
  initialFilters = {} 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    isFree: '',
    sortBy: 'newest',
    ...initialFilters
  });

  const filterOptions = {
    types: [
      { value: '', label: 'All Types' },
      { value: 'video', label: 'Videos' },
      { value: 'document', label: 'Documents' },
      { value: 'quiz', label: 'Quizzes' },
      { value: 'exercise', label: 'Exercises' },
      { value: 'summary', label: 'Summaries' },
    ],
    statuses: [
      { value: '', label: 'All Statuses' },
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ],
    access: [
      { value: '', label: 'All Access' },
      { value: 'free', label: 'Free' },
      { value: 'premium', label: 'Premium' },
    ],
    sortOptions: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'title-asc', label: 'Title (A-Z)' },
      { value: 'title-desc', label: 'Title (Z-A)' },
    ]
  };

  // Update parent component when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      isFree: '',
      sortBy: 'newest'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value && key !== 'sortBy'
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="p-4">
        {/* Main Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search content..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiFilter className="mr-1.5 h-4 w-4" />
              {isExpanded ? 'Hide Filters' : 'Filters'}
              {hasActiveFilters && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-indigo-600 text-white text-xs">
                  {Object.values(filters).filter(Boolean).length - 1}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {/* Content Type Filter */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type
                </label>
                <div className="relative">
                  <select
                    id="type"
                    name="type"
                    value={filters.type}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {filterOptions.types.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {filterOptions.statuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Access Filter */}
              <div>
                <label htmlFor="isFree" className="block text-sm font-medium text-gray-700 mb-1">
                  Access
                </label>
                <div className="relative">
                  <select
                    id="isFree"
                    name="isFree"
                    value={filters.isFree}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {filterOptions.access.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    id="sortBy"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {filterOptions.sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || key === 'sortBy') return null;
                    
                    let label = value;
                    if (key === 'type') {
                      const option = filterOptions.types.find(opt => opt.value === value);
                      label = option ? option.label : value;
                    } else if (key === 'status') {
                      const option = filterOptions.statuses.find(opt => opt.value === value);
                      label = option ? option.label : value;
                    } else if (key === 'isFree') {
                      const option = filterOptions.access.find(opt => opt.value === value);
                      label = option ? option.label : value;
                    }
                    
                    return (
                      <span 
                        key={key}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {`${key.charAt(0).toUpperCase() + key.slice(1)}: ${label}`}
                        <button
                          type="button"
                          onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                          className="ml-1.5 flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                        >
                          <span className="sr-only">Remove filter</span>
                          <FiX className="h-2 w-2" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
