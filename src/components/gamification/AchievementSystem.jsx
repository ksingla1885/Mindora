'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiAward, 
  FiFilter, 
  FiSearch, 
  FiCheckCircle, 
  FiClock,
  FiLock,
  FiStar,
  FiUsers,
  FiZap,
  FiShare2,
  FiCalendar,
  FiGift
} from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

// Mock data for achievement categories
const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'learning', name: 'Learning', icon: <FiBookOpen className="mr-2 h-4 w-4 text-blue-500" /> },
  { id: 'community', name: 'Community', icon: <FiUsers className="mr-2 h-4 w-4 text-green-500" /> },
  { id: 'mastery', name: 'Mastery', icon: <FiAward className="mr-2 h-4 w-4 text-purple-500" /> },
  { id: 'streak', name: 'Streaks', icon: <FiZap className="mr-2 h-4 w-4 text-yellow-500" /> },
  { id: 'seasonal', name: 'Seasonal', icon: <FiCalendar className="mr-2 h-4 w-4 text-red-500" /> },
];

// Mock data for achievement rarities
const ACHIEVEMENT_RARITIES = [
  { id: 'all', name: 'All Rarities' },
  { id: 'common', name: 'Common', color: 'bg-gray-100 text-gray-800' },
  { id: 'uncommon', name: 'Uncommon', color: 'bg-green-100 text-green-800' },
  { id: 'rare', name: 'Rare', color: 'bg-blue-100 text-blue-800' },
  { id: 'epic', name: 'Epic', color: 'bg-purple-100 text-purple-800' },
  { id: 'legendary', name: 'Legendary', color: 'bg-yellow-100 text-yellow-800' },
];

// Mock data for achievement status
const ACHIEVEMENT_STATUS = [
  { id: 'all', name: 'All Status' },
  { id: 'unlocked', name: 'Unlocked' },
  { id: 'locked', name: 'Locked' },
  { id: 'in_progress', name: 'In Progress' },
];

const AchievementSystem = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [shareData, setShareData] = useState(null);

  // Fetch achievements data
  const { data: achievementsData, isLoading, refetch } = useQuery({
    queryKey: ['achievements', { 
      userId: session?.user?.id,
      category: selectedCategory,
      rarity: selectedRarity,
      status: selectedStatus,
      search: searchQuery,
      tab: activeTab
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory,
        rarity: selectedRarity,
        status: selectedStatus,
        search: searchQuery,
        tab: activeTab
      });

      const response = await fetch(`/api/gamification/achievements?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  // Handle share achievement
  const handleShareAchievement = async (achievement) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `I unlocked: ${achievement.name} on Mindora!`,
          text: `Check out my achievement: ${achievement.name} - ${achievement.description}`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        setShareData({
          title: `I unlocked: ${achievement.name} on Mindora!`,
          text: `Check out my achievement: ${achievement.name} - ${achievement.description}`,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get achievement progress percentage
  const getProgressPercentage = (achievement) => {
    if (!achievement.progress) return 0;
    return Math.min(Math.round((achievement.progress.current / achievement.progress.target) * 100), 100);
  };

  // Get achievement status
  const getAchievementStatus = (achievement) => {
    if (achievement.unlocked) return 'unlocked';
    if (achievement.progress?.current > 0) return 'in_progress';
    return 'locked';
  };

  // Filter achievements by status
  const filterAchievements = (achievements, status) => {
    if (status === 'all') return achievements;
    return achievements.filter(achievement => {
      const achievementStatus = getAchievementStatus(achievement);
      return achievementStatus === status;
    });
  };

  // Get filtered achievements
  const getFilteredAchievements = () => {
    if (!achievementsData?.achievements) return [];
    
    let filtered = [...achievementsData.achievements];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(achievement => 
        achievement.name.toLowerCase().includes(query) || 
        achievement.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }
    
    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(achievement => achievement.rarity === selectedRarity);
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(achievement => {
        const status = getAchievementStatus(achievement);
        return status === selectedStatus;
      });
    }
    
    return filtered;
  };

  // Get achievement icon based on category
  const getAchievementIcon = (category) => {
    const found = ACHIEVEMENT_CATEGORIES.find(cat => cat.id === category);
    return found?.icon || <FiAward className="h-6 w-6" />;
  };

  // Get achievement rarity class
  const getRarityClass = (rarity) => {
    const found = ACHIEVEMENT_RARITIES.find(r => r.id === rarity);
    return found?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Achievements</h2>
          <p className="text-muted-foreground">
            Track your progress and unlock new achievements
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search achievements..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {ACHIEVEMENT_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  {category.icon || <FiAward className="mr-2 h-4 w-4" />}
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedRarity} onValueChange={setSelectedRarity}>
          <SelectTrigger>
            <SelectValue placeholder="Select rarity" />
          </SelectTrigger>
          <SelectContent>
            {ACHIEVEMENT_RARITIES.map((rarity) => (
              <SelectItem key={rarity.id} value={rarity.id}>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${rarity.color}`}></span>
                  {rarity.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {ACHIEVEMENT_STATUS.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Achievements</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
        </TabsList>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-2 bg-muted rounded-full w-full"></div>
                </CardFooter>
              </Card>
            ))
          ) : getFilteredAchievements().length > 0 ? (
            getFilteredAchievements().map((achievement) => {
              const isUnlocked = achievement.unlocked;
              const progress = getProgressPercentage(achievement);
              const status = getAchievementStatus(achievement);
              
              return (
                <Card 
                  key={achievement.id}
                  className={`relative overflow-hidden ${
                    isUnlocked ? 'border-green-200 dark:border-green-900' : 'opacity-80'
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <FiCheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isUnlocked ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          {getAchievementIcon(achievement.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{achievement.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRarityClass(achievement.rarity)}`}
                          >
                            {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground mb-3">
                      {achievement.description}
                    </p>
                    
                    {achievement.rewards && achievement.rewards.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-1">Rewards:</p>
                        <div className="flex flex-wrap gap-2">
                          {achievement.rewards.map((reward, i) => (
                            <TooltipProvider key={i}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="flex items-center">
                                    {reward.type === 'xp' && <FiZap className="h-3 w-3 mr-1 text-yellow-500" />}
                                    {reward.type === 'badge' && <FiAward className="h-3 w-3 mr-1 text-blue-500" />}
                                    {reward.type === 'premium' && <FiStar className="h-3 w-3 mr-1 text-purple-500" />}
                                    {reward.amount} {reward.type.toUpperCase()}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{reward.description || `Awarded for unlocking this achievement`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {status === 'in_progress' && achievement.progress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{achievement.progress.current} / {achievement.progress.target}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {status === 'locked' && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FiLock className="h-3 w-3 mr-1" />
                        <span>Locked - {achievement.hint || 'Complete the requirements to unlock'}</span>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center pt-2">
                    <div className="text-xs text-muted-foreground">
                      {isUnlocked ? (
                        <span className="text-green-600 flex items-center">
                          <FiCheckCircle className="h-3 w-3 mr-1" />
                          Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FiClock className="h-3 w-3 mr-1" />
                          {achievement.estimatedTime || 'Time to complete varies'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2
                    ">
                      {isUnlocked && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => handleShareAchievement(achievement)}
                        >
                          <FiShare2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      )}
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => {
                                // View achievement details
                                console.log('Viewing achievement:', achievement.id);
                              }}
                            >
                              View Details
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View detailed information about this achievement</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <FiAward className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>No achievements found matching your filters.</p>
              <Button 
                variant="ghost" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedRarity('all');
                  setSelectedStatus('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Tabs>

      {/* Share Dialog */}
      {shareData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Share Achievement</h3>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="font-medium">{shareData.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{shareData.text}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShareData(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareData.url);
                      alert('Link copied to clipboard!');
                      setShareData(null);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;
