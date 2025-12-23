'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useGamificationEvents() {
  const { subscribe, unsubscribe } = useWebSocket();
  const queryClient = useQueryClient();

  // Handle new achievements
  const handleNewAchievement = useCallback((data) => {
    const { badge, user } = data;
    
    toast({
      title: '🎉 Achievement Unlocked!',
      description: `You've earned the "${badge.name}" badge!`,
      variant: 'default',
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to badges page or show badge details
          console.log('Navigate to badge:', badge.id);
        },
      },
    });

    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries(['userBadges']);
    queryClient.invalidateQueries(['userProgress']);
  }, [queryClient]);

  // Handle level up
  const handleLevelUp = useCallback((data) => {
    const { newLevel, xpEarned } = data;
    
    toast({
      title: `🎉 Level ${newLevel} Unlocked!`,
      description: `You've earned ${xpEarned} XP and reached level ${newLevel}!`,
      variant: 'default',
      duration: 5000,
    });

    // Invalidate relevant queries
    queryClient.invalidateQueries(['userProgress']);
    queryClient.invalidateQueries(['leaderboard']);
  }, [queryClient]);

  // Handle challenge completion
  const handleChallengeCompleted = useCallback((data) => {
    const { challenge, reward } = data;
    
    toast({
      title: '🏆 Challenge Completed!',
      description: `You've completed the "${challenge.title}" challenge and earned ${reward.xp} XP${reward.badge ? ` and a new badge!` : ''}`,
      variant: 'default',
      duration: 5000,
    });

    // Invalidate relevant queries
    queryClient.invalidateQueries(['challenges']);
    queryClient.invalidateQueries(['userProgress']);
  }, [queryClient]);

  // Handle streak updates
  const handleStreakUpdated = useCallback((data) => {
    const { currentStreak, previousStreak } = data;
    
    if (currentStreak > previousStreak) {
      toast({
        title: '🔥 Streak Extended!',
        description: `You're on a ${currentStreak}-day streak! Keep it going!`,
        variant: 'default',
        duration: 5000,
      });
    } else if (currentStreak === 0 && previousStreak > 0) {
      toast({
        title: '⚠️ Streak Broken',
        description: 'Your streak has been reset. Log in tomorrow to start a new one!',
        variant: 'destructive',
        duration: 5000,
      });
    }

    // Invalidate relevant queries
    queryClient.invalidateQueries(['userProgress']);
  }, [queryClient]);

  // Subscribe to events when the component mounts
  useEffect(() => {
    // Subscribe to gamification events
    subscribe('ACHIEVEMENT_EARNED', handleNewAchievement);
    subscribe('LEVEL_UP', handleLevelUp);
    subscribe('CHALLENGE_COMPLETED', handleChallengeCompleted);
    subscribe('STREAK_UPDATED', handleStreakUpdated);

    // Clean up subscriptions when the component unmounts
    return () => {
      unsubscribe('ACHIEVEMENT_EARNED', handleNewAchievement);
      unsubscribe('LEVEL_UP', handleLevelUp);
      unsubscribe('CHALLENGE_COMPLETED', handleChallengeCompleted);
      unsubscribe('STREAK_UPDATED', handleStreakUpdated);
    };
  }, [subscribe, unsubscribe, handleNewAchievement, handleLevelUp, handleChallengeCompleted, handleStreakUpdated]);

  return null; // This hook doesn't render anything
}
