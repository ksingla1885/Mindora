'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiZap, 
  FiCheckCircle, 
  FiGift, 
  FiAward,
  FiCalendar,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink
} from 'react-icons/fi';
import { format, addDays, subDays, isToday, isSameDay, isAfter, isBefore, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Mock data for streak rewards
const STREAK_REWARDS = [
  { days: 3, xp: 50, badge: '3-day-streak', title: '3-Day Streak Starter' },
  { days: 7, xp: 150, badge: '7-day-streak', title: 'Weekly Champion' },
  { days: 14, xp: 350, badge: '14-day-streak', title: 'Fortnight Legend' },
  { days: 30, xp: 1000, badge: '30-day-streak', title: 'Monthly Master' },
  { days: 60, xp: 2500, badge: '60-day-streak', title: 'Dedicated Learner' },
  { days: 90, xp: 5000, badge: '90-day-streak', title: 'Seasoned Veteran' },
  { days: 180, xp: 10000, badge: '180-day-streak', title: 'Half-Year Hero' },
  { days: 365, xp: 25000, badge: '365-day-streak', title: 'Year of Excellence' },
];

const StreakSystem = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Start with the most recent Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(today.setDate(diff));
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showRewardDetails, setShowRewardDetails] = useState(null);

  // Fetch streak data
  const { data: streakData, isLoading } = useQuery({
    queryKey: ['streak', { userId: session?.user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/gamification/streak?userId=${session?.user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch streak data');
      }
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  // Mark day as completed
  const { mutate: markDayComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: async (date) => {
      const response = await fetch('/api/gamification/streak/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: session.user.id,
          date: date.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark day as complete');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });

  // Claim streak reward
  const { mutate: claimReward, isPending: isClaimingReward } = useMutation({
    mutationFn: async (reward) => {
      const response = await fetch('/api/gamification/streak/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: session.user.id,
          rewardId: reward.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim reward');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      setShowRewardDetails(null);
    },
  });

  // Generate days for the current week view
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date,
      day: format(date, 'EEE'),
      dateNum: format(date, 'd'),
      isToday: isToday(date),
      isSelected: isSameDay(selectedDate, date),
      isCompleted: streakData?.completedDays?.some(d => isSameDay(parseISO(d), date)),
      isFuture: isAfter(date, new Date()),
    };
  });

  // Calculate next reward
  const nextReward = STREAK_REWARDS.find(
    reward => !streakData?.claimedRewards?.includes(reward.days.toString())
  );

  // Calculate progress to next reward
  const progressToNextReward = nextReward 
    ? Math.min((streakData?.currentStreak || 0) / nextReward.days * 100, 100)
    : 100;

  // Handle day selection
  const handleDayClick = (day) => {
    if (isAfter(day.date, new Date())) return; // Can't select future dates
    setSelectedDate(day.date);
  };

  // Handle marking a day as complete
  const handleCompleteDay = () => {
    if (isMarkingComplete) return;
    markDayComplete(selectedDate);
  };

  // Navigate to previous/next week
  const navigateWeek = (direction) => {
    setCurrentWeekStart(prev => {
      return direction === 'prev' 
        ? subDays(prev, 7)
        : addDays(prev, 7);
    });
  };

  // Format date for display
  const formatDateRange = () => {
    const start = format(currentWeekStart, 'MMM d');
    const end = format(addDays(currentWeekStart, 6), 'MMM d, yyyy');
    return `${start} - ${end}`;
  };

  // Get streak status message
  const getStreakStatus = () => {
    if (!streakData) return 'Loading...';
    
    const { currentStreak, longestStreak } = streakData;
    
    if (currentStreak === 0) {
      return 'Start a new streak by completing your first day!';
    }
    
    if (currentStreak === 1) {
      return 'You\'re on a 1-day streak! Keep it going!';
    }
    
    if (currentStreak >= 7) {
      return `🔥 Amazing! ${currentStreak}-day streak! Your longest is ${longestStreak} days.`;
    }
    
    return `You're on a ${currentStreak}-day streak! Your longest is ${longestStreak} days.`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Streak System</h2>
          <p className="text-muted-foreground">
            Keep your learning streak alive and earn rewards!
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Streak Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FiZap className="h-6 w-6 mr-2 text-yellow-500" />
            Your Current Streak
          </CardTitle>
          <CardDescription>
            {getStreakStatus()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {isLoading ? '...' : streakData?.currentStreak || 0}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                {streakData?.currentStreak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
            
            <div className="h-16 w-px bg-border mx-4" />
            
            <div className="text-center p-4">
              <div className="text-4xl font-bold">
                {isLoading ? '...' : streakData?.longestStreak || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Best Streak
              </div>
            </div>
            
            <div className="h-16 w-px bg-border mx-4" />
            
            <div className="text-center p-4">
              <div className="text-4xl font-bold">
                {isLoading ? '...' : streakData?.totalDays || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Days
              </div>
            </div>
          </div>
          
          {/* Weekly Calendar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Weekly Progress</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigateWeek('prev')}
                  disabled={isLoading}
                >
                  <FiChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatDateRange()}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigateWeek('next')}
                  disabled={isLoading || isAfter(addDays(currentWeekStart, 7), new Date())}
                >
                  <FiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => handleDayClick(day)}
                  disabled={day.isFuture}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg transition-colors',
                    day.isSelected ? 'bg-accent' : 'hover:bg-muted/50',
                    day.isFuture ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    day.isToday && 'ring-2 ring-primary/50',
                    day.isCompleted ? 'bg-green-50 dark:bg-green-900/30' : 'bg-muted/30'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    day.isToday ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {day.day}
                  </span>
                  <span className={cn(
                    'h-8 w-8 flex items-center justify-center rounded-full mt-1',
                    day.isCompleted 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                      : day.isToday 
                        ? 'bg-primary text-primary-foreground' 
                        : ''
                  )}>
                    {day.dateNum}
                  </span>
                  {day.isCompleted && (
                    <FiCheckCircle className="h-4 w-4 mt-1 text-green-500" />
                  )}
                </button>
              ))}
            </div>
            
            {selectedDate && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {isToday(selectedDate) 
                      ? 'Today\'s Progress' 
                      : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h4>
                  {isToday(selectedDate) && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Today
                    </Badge>
                  )}
                </div>
                
                {isToday(selectedDate) ? (
                  <div className="space-y-4
                  ">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Daily Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {streakData?.todayProgress?.completed || 0} / {streakData?.todayProgress?.total || 3} completed
                        </span>
                      </div>
                      <Progress 
                        value={streakData?.todayProgress ? 
                          (streakData.todayProgress.completed / streakData.todayProgress.total) * 100 : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Activities</h5>
                      <div className="space-y-2">
                        {[
                          { id: 'lesson', name: 'Complete a lesson', completed: false },
                          { id: 'quiz', name: 'Score 80%+ on a quiz', completed: false },
                          { id: 'practice', name: 'Practice for 15 minutes', completed: false },
                        ].map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-2">
                            <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                              {activity.completed && (
                                <FiCheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <span className={`text-sm ${activity.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {activity.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      disabled={isMarkingComplete}
                      onClick={handleCompleteDay}
                    >
                      {isMarkingComplete ? (
                        'Saving...'
                      ) : (
                        <>
                          <FiCheckCircle className="mr-2 h-4 w-4" />
                          {streakData?.todayProgress?.completed === streakData?.todayProgress?.total
                            ? 'Mark as Complete'
                            : 'Complete Activities to Continue Streak'}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {streakData?.completedDays?.some(d => isSameDay(parseISO(d), selectedDate)) ? (
                      <div className="flex flex-col items-center">
                        <FiCheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <p>You completed your daily goal!</p>
                        <p className="text-xs mt-1">
                          {format(parseISO(streakData.completedDays.find(d => isSameDay(parseISO(d), selectedDate))), 'h:mm a')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <FiClock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p>No activity recorded</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Next Reward Progress */}
          {nextReward && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Next Reward</h3>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {nextReward.days}-Day Streak Reward
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {streakData?.currentStreak || 0} / {nextReward.days} days
                  </span>
                  <span className="font-medium">{nextReward.title}</span>
                </div>
                <Progress value={progressToNextReward} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Keep going!</span>
                  <span>{nextReward.xp} XP + Badge</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowRewardDetails(nextReward)}
              >
                <FiGift className="mr-2 h-4 w-4" />
                View All Rewards
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Reward Details Modal */}
      {showRewardDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Streak Rewards</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowRewardDetails(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Maintain your streak to unlock these amazing rewards! Your current streak is 
                <span className="font-medium text-foreground"> {streakData?.currentStreak || 0} days</span>.
              </p>
              
              <div className="space-y-2">
                {STREAK_REWARDS.map((reward) => {
                  const isClaimed = streakData?.claimedRewards?.includes(reward.days.toString());
                  const isNext = reward.days === nextReward?.days;
                  const canClaim = !isClaimed && (streakData?.currentStreak || 0) >= reward.days;
                  
                  return (
                    <div 
                      key={reward.days}
                      className={cn(
                        'p-4 rounded-lg border',
                        isClaimed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : isNext 
                            ? 'ring-2 ring-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50'
                            : 'bg-card',
                        canClaim && 'cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/10',
                      )}
                      onClick={() => canClaim && claimReward(reward)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                            isClaimed 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                              : canClaim 
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'
                                : 'bg-muted text-muted-foreground',
                            isNext && 'ring-2 ring-yellow-400'
                          )}>
                            {isClaimed ? (
                              <FiCheckCircle className="h-5 w-5" />
                            ) : (
                              <FiAward className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{reward.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {reward.days}-day streak
                            </p>
                            <div className="mt-1 flex items-center space-x-2">
                              <Badge variant="outline" className="flex items-center">
                                <FiZap className="h-3 w-3 mr-1 text-yellow-500" />
                                {reward.xp} XP
                              </Badge>
                              <Badge variant="outline">
                                <FiAward className="h-3 w-3 mr-1 text-blue-500" />
                                Badge
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {isClaimed ? (
                            <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                              <FiCheckCircle className="h-4 w-4 mr-1" />
                              Claimed
                            </div>
                          ) : canClaim ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="whitespace-nowrap"
                              disabled={isClaimingReward}
                              onClick={(e) => {
                                e.stopPropagation();
                                claimReward(reward);
                              }}
                            >
                              {isClaimingReward ? 'Claiming...' : 'Claim Reward'}
                            </Button>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {streakData?.currentStreak || 0}/{reward.days} days
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isNext && !isClaimed && (
                        <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800/50">
                          <div className="flex items-center text-yellow-700 dark:text-yellow-400 text-sm">
                            <FiZap className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>
                              {reward.days - (streakData?.currentStreak || 0)} more days to unlock this reward!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">How it works</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <FiZap className="h-4 w-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span>Complete your daily learning goal to maintain your streak</span>
                  </li>
                  <li className="flex items-start">
                    <FiGift className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Earn rewards for maintaining longer streaks</span>
                  </li>
                  <li className="flex items-start">
                    <FiAward className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>Collect badges to show off your dedication</span>
                  </li>
                  <li className="flex items-start">
                    <FiClock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground/70 flex-shrink-0" />
                    <span>Miss a day and your streak resets, but you keep your rewards!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakSystem;
