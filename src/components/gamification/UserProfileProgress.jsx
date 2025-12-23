'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FiAward, 
  FiZap, 
  FiClock, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiStar,
  FiChevronRight,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { gamificationAPI } from '@/lib/api/gamification';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGamificationEvents } from '@/hooks/useGamificationEvents';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);
dayjs.locale('en');

const AchievementBadge = ({ achievement, onSelect, isUnlocked, isNew = false }) => {
  const getIcon = () => {
    switch (achievement.type) {
      case 'STREAK':
        return <FiZap className="h-5 w-5" />;
      case 'PERFORMANCE':
        return <FiTrendingUp className="h-5 w-5" />;
      case 'MASTERY':
        return <FiStar className="h-5 w-5" />;
      default:
        return <FiAward className="h-5 w-5" />;
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-200 ${
        isUnlocked ? 'opacity-100' : 'opacity-60'
      }`}
      onClick={() => onSelect(achievement)}
    >
      <div className={`p-2 rounded-full ${
        isUnlocked 
          ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200' 
          : 'bg-gray-100 text-gray-400'
      } transition-all duration-200 group-hover:shadow-md relative`}>
        {getIcon()}
        {isNew && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </div>
    </div>
  );
};

// Function to calculate level from XP
const calculateLevel = (xp) => {
  return Math.floor(0.1 * Math.sqrt(xp)) + 1;
};

// Function to calculate XP needed for next level
const xpForNextLevel = (currentXp) => {
  const currentLevel = calculateLevel(currentXp);
  return Math.pow((currentLevel + 1) * 10, 2);
};

export default function UserProfileProgress({ userId }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [newAchievements, setNewAchievements] = useState(new Set());
  
  // Fetch user progress data
  const { 
    data: userData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['userProgress', userId || session?.user?.id],
    queryFn: async () => {
      const data = await gamificationAPI.getUserProgress(userId || session?.user?.id);
      return {
        ...data,
        level: calculateLevel(data.totalXp),
        xpForNextLevel: xpForNextLevel(data.totalXp),
        xpInCurrentLevel: data.totalXp - Math.pow((calculateLevel(data.totalXp) - 1) * 10, 2),
        xpNeededForNextLevel: xpForNextLevel(data.totalXp) - data.totalXp,
      };
    },
    enabled: !!session || !!userId,
    refetchOnWindowFocus: false,
  });
  
  // Handle real-time updates
  useGamificationEvents();
  
  // Subscribe to progress updates
  useEffect(() => {
    if (!userData?.userId) return;
    
    const handleProgressUpdate = (data) => {
      if (data.userId === (userId || session?.user?.id)) {
        queryClient.setQueryData(
          ['userProgress', userId || session?.user?.id],
          (old) => ({
            ...old,
            ...data,
            level: calculateLevel(data.totalXp),
            xpForNextLevel: xpForNextLevel(data.totalXp),
            xpInCurrentLevel: data.totalXp - Math.pow((calculateLevel(data.totalXp) - 1) * 10, 2),
            xpNeededForNextLevel: xpForNextLevel(data.totalXp) - data.totalXp,
          })
        );
      }
    };
    
    const handleAchievementEarned = (data) => {
      if (data.userId === (userId || session?.user?.id)) {
        // Add to new achievements set
        setNewAchievements(prev => {
          const newSet = new Set(prev);
          newSet.add(data.badge.id);
          return newSet;
        });
        
        // Remove from new achievements after 10 seconds
        setTimeout(() => {
          setNewAchievements(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.badge.id);
            return newSet;
          });
        }, 10000);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['userProgress', userId || session?.user?.id]);
        queryClient.invalidateQueries(['recentAchievements', userId || session?.user?.id]);
      }
    };
    
    // Set up event listeners
    const ws = new WebSocket(`ws://${window.location.host}/api/ws`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'AUTH',
        token: session?.accessToken
      }));
      
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        events: ['PROGRESS_UPDATED', 'ACHIEVEMENT_EARNED']
      }));
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'PROGRESS_UPDATED':
          handleProgressUpdate(message.data);
          break;
        case 'ACHIEVEMENT_EARNED':
          handleAchievementEarned(message.data);
          break;
      }
    };
    
    return () => {
      ws.close();
    };
  }, [userData?.userId, userId, session, queryClient]);
  
  // Calculate progress for the XP bar
  const calculateXpProgress = (userData) => {
    if (!userData?.totalXp) return 0;
    const currentLevelXp = Math.pow((userData.level - 1) * 10, 2);
    const nextLevelXp = Math.pow(userData.level * 10, 2);
    return ((userData.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  };
  
  const xpProgress = calculateXpProgress(userData);
  
  // Get achievements from the API response or use an empty array as fallback
  const unlockedAchievements = userData?.unlockedBadges || [];
  
  // Format last active time using dayjs
  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    return dayjs(timestamp).fromNow();
  };
  
  // Format streak text
  const getStreakText = (streak) => {
    if (!streak) return 'No active streak';
    return `${streak} day${streak !== 1 ? 's' : ''} in a row`;
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Progress updated');
    } catch (error) {
      toast.error('Failed to refresh progress');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FiRefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">
              Failed to load progress. {error.message}
            </p>
            <div className="mt-2">
              <button
                onClick={refetch}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {userId === session?.user?.id || !userId ? 'Your Progress' : `${userData?.user?.name || 'User'}'s Progress`}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh progress"
            >
              <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Level {userData?.level || 1}
            </span>
          </div>
        </div>
      </div>

      {/* XP and Level Progress */}
      <div className="px-6 py-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">
            {userData?.totalXp?.toLocaleString() || 0} XP
          </span>
          <span className="text-gray-500">
            {userData?.xpForNextLevel?.toLocaleString() || '--'} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Level {userData?.level || 1}</span>
          <span>{Math.round(xpProgress)}% to level {userData ? userData.level + 1 : 1}</span>
          <span>Level {userData ? userData.level + 1 : 2}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <FiZap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Current Streak</p>
              <p className="text-xl font-semibold text-gray-900">
                {getStreakText(userData?.currentStreak)}
                {userData?.currentStreak > 0 && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🔥
                  </span>
                )}
              </p>
              {userData?.longestStreak > 0 && userData.longestStreak !== userData.currentStreak && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Best: {userData.longestStreak} days
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
              <FiAward className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Achievements</p>
              <p className="text-xl font-semibold text-gray-900">
                {unlockedAchievements.length}
                {userData?.totalBadges ? ` of ${userData.totalBadges}` : ''}
              </p>
              {userData?.totalBadges > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {Math.round((unlockedAchievements.length / userData.totalBadges) * 100)}% complete
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
              <FiTrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Global Rank</p>
              <p className="text-xl font-semibold text-gray-900">
                {userData?.rank ? `#${userData.rank.toLocaleString()}` : '--'}
              </p>
              {userData?.percentile && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Top {userData.percentile}% of users
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-sm font-semibold text-gray-900">
                {userData?.createdAt ? dayjs(userData.createdAt).format('MMM D, YYYY') : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Last active {formatLastActive(userData?.lastActiveAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-gray-900">Recent Achievements</h3>
          {unlockedAchievements.length > 0 && (
            <button 
              onClick={() => {
                // Navigate to achievements page
                console.log('Navigate to achievements');
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center"
            >
              View all <FiChevronRight className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>
        
        {unlockedAchievements.length > 0 ? (
          <div className="grid grid-cols-5 gap-4">
            {unlockedAchievements.slice(0, 5).map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                isUnlocked={true}
                isNew={newAchievements.has(achievement.id)}
                onSelect={setSelectedAchievement}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <FiAward className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {userId === session?.user?.id || !userId 
                ? 'Complete challenges to earn your first achievement!'
                : 'No achievements yet'}
            </p>
            {userId === session?.user?.id && (
              <button 
                onClick={() => {
                  // Navigate to challenges
                  console.log('Navigate to challenges');
                }}
                className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View Challenges
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity && recentActivity.length > 0 ? (
          <ul className="space-y-4">
            {recentActivity.map((activity, index) => (
              <li key={index} className="bg-white shadow overflow-hidden rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiActivity className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No recent activity to display.</p>
          </div>
        )}
      </div>

      {/* Achievement Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedAchievement.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedAchievement.unlocked 
                      ? `Unlocked on ${new Date(selectedAchievement.unlockedAt).toLocaleDateString()}`
                      : 'Locked'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-4 flex flex-col items-center">
                <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
                  selectedAchievement.unlocked 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'bg-gray-100 text-gray-400'
                } mb-4`}>
                  {selectedAchievement.icon === 'award' && <FiAward className="h-10 w-10" />}
                  {selectedAchievement.icon === 'trending' && <FiTrendingUp className="h-10 w-10" />}
                  {selectedAchievement.icon === 'star' && <FiStar className="h-10 w-10" />}
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {selectedAchievement.description}
                  </p>
                  
                  {selectedAchievement.unlocked ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <FiCheckCircle className="mr-1.5 h-4 w-4" />
                      Unlocked
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      <FiLock className="mr-1.5 h-3.5 w-3.5" />
                      Locked
                    </div>
                  )}
                  
                  {selectedAchievement.progress && (
                    <div className="mt-4 w-full">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{selectedAchievement.progress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: '40%' }} // You would calculate this based on progress
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
