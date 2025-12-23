'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function DPPCard({ dpp, onStart, isCompleted = false, isLocked = false }) {
  const { id, title, description, subject, topic, difficulty, points, dueDate, timeLimit } = dpp;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">
              {subject} • {topic} • {difficulty}
            </CardDescription>
          </div>
          {isCompleted ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span>Completed</span>
            </div>
          ) : isLocked ? (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="w-5 h-5 mr-1" />
              <span>Locked</span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
        
        <div className="flex flex-col space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>Time limit: {timeLimit} minutes</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M12 2v4" />
              <path d="m16.2 7.8 2.9-2.9" />
              <path d="M18 12h4" />
              <path d="m16.2 16.2 2.9 2.9" />
              <path d="M12 18v4" />
              <path d="m4.9 19.1 2.9-2.9" />
              <path d="M2 12h4" />
              <path d="m4.9 4.9 2.9 2.9" />
            </svg>
            <span>Points: {points}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isCompleted ? 'Completed' : isLocked ? 'Unlocks soon' : 'Ready to start'}
          </span>
          <Button 
            onClick={() => onStart(dpp)} 
            disabled={isLocked}
            className={`${isCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : ''}`}
          >
            {isCompleted ? 'View Results' : isLocked ? 'Locked' : 'Start Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
