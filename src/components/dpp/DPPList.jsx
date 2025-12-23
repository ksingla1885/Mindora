'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DPPCard } from './DPPCard';
import { Skeleton } from '@/components/ui/skeleton';

export function DPPList({ initialDpps = [], onDPPSelect, isLoading = false }) {
  const [activeTab, setActiveTab] = useState('all');
  const [dpps, setDpps] = useState(initialDpps);

  // Filter DPPs based on the active tab
  const filteredDpps = dpps.filter(dpp => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return !dpp.isCompleted && !dpp.isLocked;
    if (activeTab === 'completed') return dpp.isCompleted;
    if (activeTab === 'upcoming') return dpp.isLocked;
    return true;
  });

  // Sort DPPs: pending first, then by due date
  const sortedDpps = [...filteredDpps].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="all" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {sortedDpps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <h3 className="text-lg font-medium">
                  {activeTab === 'completed' 
                    ? 'No completed DPPs yet' 
                    : activeTab === 'upcoming'
                    ? 'No upcoming DPPs'
                    : 'No DPPs available'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {activeTab === 'completed'
                    ? 'Your completed DPPs will appear here.'
                    : 'Check back later for new DPPs.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedDpps.map((dpp) => (
                <DPPCard 
                  key={dpp.id} 
                  dpp={dpp} 
                  onStart={onDPPSelect}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
