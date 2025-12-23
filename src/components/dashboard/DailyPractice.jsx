'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiAward, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function DailyPractice() {
  const [dpp, setDpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    const fetchDailyPractice = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/daily-practice');
        
        if (!response.ok) {
          throw new Error('Failed to fetch daily practice');
        }
        
        const data = await response.json();
        setDpp(data.question);
        setStreak(data.streak || 0);
        setCompletedToday(data.completedToday || false);
      } catch (err) {
        console.error('Error fetching daily practice:', err);
        setError('Failed to load daily practice');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyPractice();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <FiAward className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900">Daily Practice Problem</h3>
            <p className="mt-1 text-sm text-gray-500">
              {completedToday 
                ? 'You\'ve completed today\'s challenge! 🎉' 
                : 'Solve today\'s problem to continue your streak'}
            </p>
          </div>
          
          {streak > 0 && (
            <div className="ml-4 flex-shrink-0">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <FiClock className="-ml-0.5 mr-1.5 h-4 w-4" />
                {streak} day{streak !== 1 ? 's' : ''} streak
              </div>
            </div>
          )}
        </div>

        {dpp && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900">Today's Challenge</h4>
            <p className="mt-1 text-sm text-gray-600 line-clamp-3">
              {dpp.text}
            </p>
            
            <div className="mt-4">
              <Link
                href={`/practice/${dpp.id}`}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  completedToday 
                    ? 'bg-gray-400 hover:bg-gray-500' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                disabled={completedToday}
              >
                {completedToday ? (
                  <>
                    <FiCheckCircle className="-ml-1 mr-2 h-5 w-5" />
                    Completed Today
                  </>
                ) : (
                  'Start Solving'
                )}
              </Link>
            </div>
          </div>
        )}

        {!dpp && (
          <div className="mt-4 text-center py-4">
            <p className="text-sm text-gray-500">No practice problem available for today.</p>
            <p className="text-xs text-gray-400 mt-1">Check back tomorrow for a new challenge!</p>
          </div>
        )}

        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">This Week's Progress</h4>
          <div className="flex items-center justify-between">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const isCompleted = index < streak % 7;
              const isToday = index === new Date().getDay() - 1; // 0 = Sunday
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : isToday 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                  {isToday && (
                    <div className="mt-1 h-1 w-1 rounded-full bg-indigo-600"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
