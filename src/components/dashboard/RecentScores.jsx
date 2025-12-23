'use client';

import { useState, useEffect } from 'react';
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

export default function RecentScores() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    improvement: 0,
  });

  useEffect(() => {
    const fetchRecentScores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/scores/recent');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recent scores');
        }
        
        const data = await response.json();
        setScores(data.scores || []);
        setStats(data.stats || {});
      } catch (err) {
        console.error('Error fetching recent scores:', err);
        setError('Failed to load recent scores');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentScores();
  }, []);

  const getTrendIcon = (value) => {
    if (value > 0) {
      return <FiTrendingUp className="h-5 w-5 text-green-500" />;
    } else if (value < 0) {
      return <FiTrendingDown className="h-5 w-5 text-red-500" />;
    }
    return <FiMinus className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiBarChart2 className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-8">
        <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No test results yet</h3>
        <p className="mt-1 text-sm text-gray-500">Complete a test to see your scores here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Performance Overview</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Your recent test scores and statistics</p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Average Score</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <span className="text-2xl font-semibold">{stats.average}%</span>
                {stats.improvement !== 0 && (
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stats.improvement > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {getTrendIcon(stats.improvement)}
                    <span className="ml-1">{Math.abs(stats.improvement)}%</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.improvement > 0 
                  ? `Up ${stats.improvement}% from last period` 
                  : stats.improvement < 0 
                    ? `Down ${Math.abs(stats.improvement)}% from last period`
                    : 'No change from last period'}
              </p>
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Highest Score</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className="text-xl font-semibold">{stats.highest}%</span>
              {stats.highestTest && (
                <span className="ml-2 text-sm text-gray-500">
                  on {stats.highestTest.title}
                </span>
              )}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Tests Completed</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <span className="text-xl font-semibold">{scores.length}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {scores.length === 1 ? 'test' : 'tests'} in total
                </span>
              </div>
            </dd>
          </div>
        </dl>
      </div>
      
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Test Results</h4>
        <div className="flow-root">
          <ul className="-mb-8">
            {scores.slice(0, 5).map((score, index) => (
              <li key={score.id}>
                <div className="relative pb-8">
                  {index !== scores.length - 1 && (
                    <span 
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        score.percentage >= 70 ? 'bg-green-500' : 
                        score.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        <FiBarChart2 className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-800">
                          Scored {score.percentage}% on <span className="font-medium">{score.test.title}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(score.completedAt).toLocaleDateString()} • {score.correctAnswers} of {score.totalQuestions} correct
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {new Date(score.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {scores.length > 5 && (
          <div className="mt-4 text-center">
            <a
              href="/scores"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View all test results
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
