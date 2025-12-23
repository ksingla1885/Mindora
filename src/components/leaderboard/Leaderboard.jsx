'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiAward, FiFilter, FiChevronDown, FiChevronUp, FiUser, FiStar, FiTrendingUp } from 'react-icons/fi';

const Leaderboard = () => {
  const { data: session } = useSession();
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    subjectId: '',
    classLevel: '',
    limit: 20,
    offset: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.classLevel) params.append('class', filters.classLevel);
      params.append('limit', filters.limit);
      params.append('offset', filters.offset);

      const response = await fetch(`/api/leaderboards?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const data = await response.json();
      setLeaderboardData(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page when filters change
    }));
  };

  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const getMedalColor = (rank) => {
    switch(rank) {
      case 1: return 'bg-yellow-100 text-yellow-600 border-yellow-400';
      case 2: return 'bg-gray-100 text-gray-600 border-gray-300';
      case 3: return 'bg-amber-50 text-amber-700 border-amber-400';
      default: return 'bg-white';
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getMedalColor(rank)}`}>
          <FiAward className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
        {rank}
      </div>
    );
  };

  if (loading && !leaderboardData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAward className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Leaderboard</h2>
            <p className="mt-1 text-sm text-gray-500">
              {leaderboardData?.filters.selectedSubject 
                ? `Top performers in ${leaderboardData.filters.selectedSubject.name}`
                : 'Top performers across all subjects'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filters
            {showFilters ? (
              <FiChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <FiChevronDown className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Subjects</option>
                {leaderboardData?.filters.subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                id="class"
                value={filters.classLevel}
                onChange={(e) => handleFilterChange('classLevel', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Classes</option>
                {leaderboardData?.filters.classLevels?.map((classLevel) => (
                  <option key={classLevel} value={classLevel}>
                    Class {classLevel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* User's Rank Card */}
      {session && leaderboardData?.userRank && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FiUser className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-indigo-900">
                  Your Rank
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-indigo-700">
                    {leaderboardData.userRank.rank}
                  </span>
                  <span className="ml-2 text-sm text-indigo-600">
                    with {leaderboardData.userRank.totalScore} points
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-indigo-700">
                {leaderboardData.userRank.testCount} tests taken
              </div>
              <div className="h-8 w-px bg-indigo-200"></div>
              <div className="text-sm text-indigo-700">
                {leaderboardData.userRank.averageScore}% avg. score
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tests
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboardData?.leaderboard.map((entry) => (
              <tr 
                key={entry.id} 
                className={`${entry.isCurrentUser ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRankBadge(entry.rank)}
                    {entry.rank <= 3 && (
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {entry.rank === 1 ? 'Gold' : entry.rank === 2 ? 'Silver' : 'Bronze'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {entry.user.image ? (
                        <img className="h-10 w-10 rounded-full" src={entry.user.image} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.user.name}
                        {entry.isCurrentUser && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Class {entry.user.class}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {entry.totalScore}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {entry.testCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {entry.averageScore}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {leaderboardData?.leaderboard.length === 0 && (
        <div className="text-center py-12">
          <FiAward className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {leaderboardData?.pagination.hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Participants</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {leaderboardData?.pagination.total.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FiStar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Top Score</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {leaderboardData?.leaderboard[0]?.totalScore || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FiAward className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg. Score</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {leaderboardData?.leaderboard.length > 0
                          ? Math.round(
                              leaderboardData.leaderboard.reduce(
                                (acc, curr) => acc + curr.averageScore,
                                0
                              ) / leaderboardData.leaderboard.length
                            )
                          : 0}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
