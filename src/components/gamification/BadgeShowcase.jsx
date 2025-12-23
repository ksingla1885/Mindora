'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FiAward, 
  FiFilter, 
  FiChevronDown, 
  FiX, 
  FiCheck, 
  FiLock, 
  FiAlertCircle, 
  FiRotateCw,
  FiSearch,
  FiXCircle
} from 'react-icons/fi';
import { gamificationAPI } from '@/lib/api/gamification';
import { toast } from 'react-hot-toast';

export default function BadgeShowcase() {
  const { data: session } = useSession();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all', // all, earned, unearned
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch badges from API
      const data = await gamificationAPI.getBadges({
        category: filters.category !== 'all' ? filters.category : undefined,
        search: filters.search || undefined
      });
      
      setBadges(data.badges);
      
      // Extract unique categories if not already loaded
      if (categories.length === 0) {
        const uniqueCategories = [...new Set(data.badges.map(badge => badge.category))];
        setCategories(uniqueCategories);
      }
      
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError('Failed to load badges. Please try again.');
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.category, filters.search, categories.length]);

  useEffect(() => {
    if (session) {
      fetchBadges();
    }
  }, [session, fetchBadges]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBadges();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredBadges = badges.filter(badge => {
    // Category filter
    if (filters.category !== 'all' && badge.category !== filters.category) {
      return false;
    }
    
    // Status filter
    if (filters.status === 'earned' && !badge.userProgress?.isUnlocked) {
      return false;
    }
    if (filters.status === 'unearned' && badge.userProgress?.isUnlocked) {
      return false;
    }
    
    // Search filter
    const searchTerm = filters.search.toLowerCase();
    if (searchTerm && !(
      badge.name.toLowerCase().includes(searchTerm) ||
      badge.description.toLowerCase().includes(searchTerm) ||
      badge.category.toLowerCase().includes(searchTerm)
    )) {
      return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      search: ''
    });
  };

  const hasActiveFilters = filters.category !== 'all' || 
                         filters.status !== 'all' || 
                         filters.search !== '';

  const getCategoryColor = (category) => {
    const colors = {
      PERFORMANCE: 'bg-blue-100 text-blue-800',
      MILESTONE: 'bg-purple-100 text-purple-800',
      MASTERY: 'bg-yellow-100 text-yellow-800',
      SPECIAL: 'bg-pink-100 text-pink-800',
      STREAK: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTierColor = (tier) => {
    return {
      1: 'bg-amber-200 text-amber-800',
      2: 'bg-slate-200 text-slate-800',
      3: 'bg-yellow-200 text-yellow-800'
    }[tier] || 'bg-gray-200 text-gray-800';
  };

  if (loading && !isRefreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-sm text-gray-500">Loading badges...</p>
      </div>
    );
  }

  if (error && !isRefreshing) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <div className="mt-2">
              <button
                onClick={fetchBadges}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiRotateCw className="mr-1.5 h-3.5 w-3.5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-medium text-gray-900">Badge Collection</h2>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh badges"
              >
                <FiRotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {filteredBadges.length} {filteredBadges.length === 1 ? 'badge' : 'badges'} found
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search badges..."
                className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiFilter className="mr-2 h-4 w-4" />
                Filters
                {showFilters ? (
                  <FiChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <FiChevronDown className="ml-2 h-4 w-4" />
                )}
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0) + category.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded-md"
                >
                  <option value="all">All Badges</option>
                  <option value="earned">Earned</option>
                  <option value="unearned">Not Earned</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Reset All Filters
                </button>
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {filters.category !== 'all' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Category: {filters.category}
                      <button
                        onClick={() => handleFilterChange('category', 'all')}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-indigo-200 text-indigo-600 hover:bg-indigo-300 focus:outline-none"
                      >
                        <span className="sr-only">Remove category filter</span>
                        <FiX className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  
                  {filters.status !== 'all' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Status: {filters.status === 'earned' ? 'Earned' : 'Not Earned'}
                      <button
                        onClick={() => handleFilterChange('status', 'all')}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300 focus:outline-none"
                      >
                        <span className="sr-only">Remove status filter</span>
                        <FiX className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  
                  {filters.search && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: {filters.search}
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 focus:outline-none"
                      >
                        <span className="sr-only">Remove search term</span>
                        <FiX className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badge Grid */}
      {filteredBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 sm:p-6">
          {filteredBadges.map((badge) => (
            <div 
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative bg-white rounded-lg border ${
                badge.userProgress?.isUnlocked 
                  ? 'border-transparent shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer' 
                  : 'border-gray-200 opacity-75'
              } overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-center justify-center mb-3">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                    badge.userProgress?.isUnlocked 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {badge.userProgress?.isUnlocked ? (
                      <FiAward className="h-10 w-10" />
                    ) : (
                      <FiLock className="h-8 w-8" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {badge.description}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getCategoryColor(badge.category)
                    }`}>
                      {badge.category.charAt(0) + badge.category.slice(1).toLowerCase()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      getTierColor(badge.tier)
                    }`}>
                      Tier {badge.tier}
                    </span>
                  </div>
                  
                  {badge.userProgress?.isUnlocked ? (
                    <div className="flex items-center justify-center text-xs text-green-600">
                      <FiCheck className="mr-1 h-3 w-3" />
                      Earned on {new Date(badge.userProgress.earnedAt).toLocaleDateString()}
                    </div>
                  ) : badge.requiredValue ? (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, ((badge.userProgress?.progress || 0) / badge.requiredValue) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {badge.userProgress?.progress || 0} / {badge.requiredValue}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <FiAward className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-3 text-base font-medium text-gray-900">No badges found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? 'No badges match your current filters. Try adjusting your search or filters.'
              : 'No badges available at the moment. Check back later for new badges!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedBadge.name}</h3>
                  <p className="text-sm text-gray-500">{selectedBadge.description}</p>
                </div>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-4 flex flex-col items-center">
                <div className={`h-32 w-32 rounded-full flex items-center justify-center ${
                  selectedBadge.userProgress?.isUnlocked 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'bg-gray-100 text-gray-400'
                } mb-4`}>
                  {selectedBadge.userProgress?.isUnlocked ? (
                    <FiAward className="h-16 w-16" />
                  ) : (
                    <FiLock className="h-12 w-12" />
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getCategoryColor(selectedBadge.category)
                  }`}>
                    {selectedBadge.category.charAt(0) + selectedBadge.category.slice(1).toLowerCase()}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    getTierColor(selectedBadge.tier)
                  }`}>
                    Tier {selectedBadge.tier}
                  </span>
                </div>
                
                {selectedBadge.userProgress?.isUnlocked ? (
                  <div className="text-center">
                    <p className="text-sm text-green-600 mb-2">
                      <FiCheck className="inline mr-1 h-4 w-4" />
                      Earned on {new Date(selectedBadge.userProgress.earnedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedBadge.userProgress.progress 
                        ? `You've completed ${selectedBadge.userProgress.progress} out of ${selectedBadge.requiredValue} requirements`
                        : 'You earned this badge!'}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-xs">
                    <p className="text-sm text-gray-600 mb-2 text-center">
                      {selectedBadge.requiredValue 
                        ? `Complete ${selectedBadge.requiredValue} ${selectedBadge.requiredValue === 1 ? 'more task' : 'more tasks'} to earn this badge`
                        : 'Complete the requirements to earn this badge'}
                    </p>
                    {selectedBadge.requiredValue > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{selectedBadge.userProgress?.progress || 0} / {selectedBadge.requiredValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, ((selectedBadge.userProgress?.progress || 0) / selectedBadge.requiredValue) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">How to earn</h4>
                <p className="text-sm text-gray-600">
                  {selectedBadge.requiredValue 
                    ? `Complete ${selectedBadge.requiredValue} ${selectedBadge.requiredValue === 1 ? 'task' : 'tasks'} in the ${selectedBadge.category.toLowerCase()} category.`
                    : 'Complete the required activities to earn this badge.'}
                </p>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
