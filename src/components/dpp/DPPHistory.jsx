'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiCheck, FiX, FiChevronRight } from 'react-icons/fi';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export default function DPPHistory({ initialHistory = [], totalItems = 0, pageSize = 10 }) {
  const router = useRouter();
  const [history, setHistory] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    topic: '',
    difficulty: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });
  const [hasMore, setHasMore] = useState(initialHistory.length < totalItems);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters,
        page: filters.page + 1,
      }).toString();

      const response = await fetch(`/api/dpp/history?${query}`);
      if (!response.ok) throw new Error('Failed to load more history');

      const { items, pagination } = await response.json();
      setHistory(prev => [...prev, ...items]);
      setFilters(prev => ({
        ...prev,
        page: pagination.page,
      }));
      setHasMore(pagination.page < pagination.totalPages);
    } catch (error) {
      console.error('Error loading more history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters,
        page: 1, // Reset to first page
      }).toString();

      const response = await fetch(`/api/dpp/history?${query}`);
      if (!response.ok) throw new Error('Failed to apply filters');

      const { items, pagination } = await response.json();
      setHistory(items);
      setFilters(prev => ({
        ...prev,
        page: 1,
      }));
      setHasMore(pagination.page < pagination.totalPages);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      subject: '',
      topic: '',
      difficulty: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
    });
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDifficultyClass = (difficulty) => {
    return difficultyColors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  if (history.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <FiCalendar className="h-full w-full" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No practice history</h3>
        <p className="mt-1 text-sm text-gray-500">Complete some practice problems to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Filters */}
      <div className="bg-gray-50 px-4 py-4 sm:px-6 border-b border-gray-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              id="subject"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            >
              <option value="">All Subjects</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="mathematics">Mathematics</option>
              <option value="biology">Biology</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="dateFrom"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {isLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <ul className="divide-y divide-gray-200">
        {history.map((item) => (
          <li key={item.id} className="hover:bg-gray-50">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${item.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {item.isCorrect ? (
                      <FiCheck className="h-5 w-5" />
                    ) : (
                      <FiX className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-blue-600">
                      {item.question.subject?.name || 'General'}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {item.question.text}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <div className="text-sm text-gray-500 flex items-center">
                    <FiClock className="mr-1 h-4 w-4 text-gray-400" />
                    <span className="mr-4">{formatTimeSpent(item.timeSpent)}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyClass(item.question.difficulty)}">
                      {item.question.difficulty}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dpp/history/${item.id}`)}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View
                    <FiChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    <p>{formatDate(item.completedAt)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Load More Button */}
      {hasMore && (
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
