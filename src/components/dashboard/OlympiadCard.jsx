'use client';

import Link from 'next/link';
import { FiAward, FiCalendar, FiClock, FiUsers } from 'react-icons/fi';

export default function OlympiadCard({ olympiad }) {
  const { id, name, startDate, endDate, registered, totalParticipants, subject } = olympiad;
  const isActive = new Date() >= new Date(startDate) && new Date() <= new Date(endDate);
  const isUpcoming = new Date() < new Date(startDate);
  const isCompleted = new Date() > new Date(endDate);

  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  const statusText = isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed';
  const statusStyle = isActive ? statusStyles.active : isUpcoming ? statusStyles.upcoming : statusStyles.completed;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <FiAward className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyle}`}>
                {statusText}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{subject?.name || 'General'}</p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <p>
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <FiUsers className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <p>{totalParticipants || 0} participants</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full" 
                  style={{ width: `${Math.min(100, (registered ? 100 : 0))}%` }}
                />
              </div>
              <span className="ml-2 text-xs font-medium text-gray-700">
                {registered ? 'Registered' : 'Not Registered'}
              </span>
            </div>
            
            {isActive || isUpcoming ? (
              <Link
                href={`/olympiads/${id}`}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                  registered ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {registered ? 'View Details' : 'Register Now'}
              </Link>
            ) : (
              <Link
                href={`/olympiads/${id}/results`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                View Results
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
