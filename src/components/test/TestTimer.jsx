'use client';

import { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';

export default function TestTimer({ 
  durationInMinutes, 
  onTimeUp,
  startTime,
  isSubmitted
}) {
  const [timeLeft, setTimeLeft] = useState(durationInMinutes * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Calculate time left based on start time and duration
  useEffect(() => {
    if (!startTime || isSubmitted) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const endTime = new Date(new Date(startTime).getTime() + durationInMinutes * 60 * 1000);
      const diffInSeconds = Math.floor((endTime - now) / 1000);
      
      return Math.max(0, diffInSeconds);
    };

    // Initial calculation
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    
    if (initialTimeLeft <= 0) {
      setIsTimeUp(true);
      onTimeUp();
      return;
    }

    // Update timer every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        setIsTimeUp(true);
        onTimeUp();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, durationInMinutes, onTimeUp, isSubmitted]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate warning and danger thresholds (last 5 minutes and last minute)
  const isWarning = timeLeft <= 300 && timeLeft > 60; // 5 minutes to 1 minute left
  const isDanger = timeLeft <= 60; // Less than 1 minute left

  return (
    <div className={`flex items-center space-x-2 ${
      isDanger ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-700'
    } font-medium`}>
      <FiClock className="w-5 h-5" />
      <span className="text-lg">{formatTime(timeLeft)}</span>
      {isTimeUp && !isSubmitted && (
        <span className="ml-2 text-sm font-normal">Time's up! Submitting your test...</span>
      )}
    </div>
  );
}
