'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import Link from 'next/link';

export default function UpcomingTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUpcomingTests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tests/upcoming');
        
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming tests');
        }
        
        const data = await response.json();
        setTests(data.tests || []);
      } catch (err) {
        console.error('Error fetching upcoming tests:', err);
        setError('Failed to load upcoming tests');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTests();
  }, []);

  const formatTimeLeft = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start - now;
    
    if (diffMs <= 0) return 'Starting soon';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `In ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `In ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-md"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-8">
        <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming tests</h3>
        <p className="mt-1 text-sm text-gray-500">Check back later for scheduled tests.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {tests.map((test) => (
          <li key={test.id}>
            <Link href={`/tests/${test.id}`} className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-indigo-600">{test.title}</p>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      {test.subject?.name || 'General'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      {test.durationMinutes} min
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <FiCalendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      {new Date(test.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p className="font-medium text-indigo-600">
                      {formatTimeLeft(test.startTime)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
