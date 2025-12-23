'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiAward, 
  FiFilter, 
  FiDownload, 
  FiCalendar, 
  FiUsers, 
  FiTrendingUp,
  FiClock,
  FiRefreshCw,
  FiTrophy,
  FiGift,
  FiBarChart2,
  FiUserCheck
} from 'react-icons/fi';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Mock data for organizations and regions
const ORGANIZATIONS = [
  { id: 'all', name: 'All Organizations' },
  { id: 'org1', name: 'Mindora Academy' },
  { id: 'org2', name: 'Tech Institute' },
  { id: 'org3', name: 'Global Learners' },
];

const REGIONS = [
  { id: 'all', name: 'All Regions' },
  { id: 'na', name: 'North America' },
  { id: 'eu', name: 'Europe' },
  { id: 'as', name: 'Asia' },
  { id: 'sa', name: 'South America' },
  { id: 'af', name: 'Africa' },
  { id: 'oc', name: 'Oceania' },
];

const TIME_RANGES = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'all_time', name: 'All Time' },
  { id: 'custom', name: 'Custom Range' },
];

const SORT_CRITERIA = [
  { id: 'total_xp', name: 'Total XP' },
  { id: 'weekly_xp', name: 'Weekly XP' },
  { id: 'challenges_completed', name: 'Challenges Completed' },
  { id: 'badges_earned', name: 'Badges Earned' },
  { id: 'streak', name: 'Current Streak' },
  { id: 'accuracy', name: 'Quiz Accuracy' },
];

const EnhancedLeaderboard = () => {
  const { data: session } = useSession();
  const [filters, setFilters] = useState({
    timeRange: 'weekly',
    organization: 'all',
    region: 'all',
    sortBy: 'total_xp',
    customRange: {
      from: null,
      to: null,
    },
  });
  const [activeTab, setActiveTab] = useState('global');
  const [showFilters, setShowFilters] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReward, setSelectedReward] = useState('');
  const [rewards, setRewards] = useState([
    { id: 'premium', name: '1 Month Premium', xp: 1000, icon: <FiTrophy className="text-yellow-500" /> },
    { id: 'badge', name: 'Exclusive Badge', xp: 500, icon: <FiAward className="text-blue-500" /> },
    { id: 'points', name: 'Bonus Points', xp: 250, icon: <FiTrendingUp className="text-green-500" /> },
  ]);

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', { 
      timeRange: filters.timeRange, 
      organization: filters.organization,
      region: filters.region,
      sortBy: filters.sortBy,
      from: filters.customRange.from?.toISOString(),
      to: filters.customRange.to?.toISOString(),
      tab: activeTab 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        organization: filters.organization,
        region: filters.region,
        sortBy: filters.sortBy,
        tab: activeTab,
        ...(filters.timeRange === 'custom' && filters.customRange.from && { 
          from: startOfDay(filters.customRange.from).toISOString() 
        }),
        ...(filters.timeRange === 'custom' && filters.customRange.to && { 
          to: endOfDay(filters.customRange.to).toISOString() 
        }),
      });

      const response = await fetch(`/api/gamification/leaderboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      return response.json();
    },
    keepPreviousData: true,
  });

  // Fetch historical snapshots
  const { data: historicalData } = useQuery({
    queryKey: ['leaderboardHistory', { timeRange: filters.timeRange }],
    queryFn: async () => {
      const response = await fetch(`/api/gamification/leaderboard/history?timeRange=${filters.timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      return response.json();
    },
    enabled: activeTab === 'historical',
  });

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle reward assignment
  const handleAssignReward = async () => {
    if (!selectedUser || !selectedReward) return;
    
    try {
      const response = await fetch('/api/gamification/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          rewardId: selectedReward,
          awardedBy: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign reward');
      }

      // Refresh leaderboard data
      refetch();
      setShowRewardsModal(false);
      setSelectedUser(null);
      setSelectedReward('');
      
      // Show success message
      alert('Reward assigned successfully!');
    } catch (error) {
      console.error('Error assigning reward:', error);
      alert('Failed to assign reward. Please try again.');
    }
  };

  // Format date range display
  const formatDateRange = () => {
    if (filters.timeRange !== 'custom') {
      return TIME_RANGES.find(t => t.id === filters.timeRange)?.name || '';
    }
    
    if (filters.customRange.from && filters.customRange.to) {
      return `${format(filters.customRange.from, 'MMM d, yyyy')} - ${format(filters.customRange.to, 'MMM d, yyyy')}`;
    }
    
    return 'Select date range';
  };

  // Get user's position in the leaderboard
  const getUserPosition = () => {
    if (!leaderboardData || !session?.user) return null;
    
    return leaderboardData.leaderboard.findIndex(
      entry => entry.user.id === session.user.id
    ) + 1;
  };

  // Get user's rank badge color
  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-50 text-blue-800 border-blue-100';
  };

  // Get user's rank icon
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  // Get metric value for sorting
  const getMetricValue = (user, metric) => {
    switch (metric) {
      case 'total_xp':
        return user.totalXp || 0;
      case 'weekly_xp':
        return user.weeklyXp || 0;
      case 'challenges_completed':
        return user.challengesCompleted || 0;
      case 'badges_earned':
        return user.badgesEarned || 0;
      case 'streak':
        return user.currentStreak || 0;
      case 'accuracy':
        return user.quizAccuracy || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <p className="text-muted-foreground">
            Track top performers and achievements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="flex items-center"
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Time Range</label>
                <Select
                  value={filters.timeRange}
                  onValueChange={(value) => handleFilterChange('timeRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map((range) => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.timeRange === 'custom' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.customRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.customRange.from ? (
                            format(filters.customRange.from, "PPP")
                          ) : (
                            <span>Start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customRange.from}
                          onSelect={(date) => 
                            handleFilterChange('customRange', { 
                              ...filters.customRange, 
                              from: date 
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.customRange.to && "text-muted-foreground"
                          )}
                          disabled={!filters.customRange.from}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.customRange.to ? (
                            format(filters.customRange.to, "PPP")
                          ) : (
                            <span>End date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customRange.to}
                          onSelect={(date) => 
                            handleFilterChange('customRange', { 
                              ...filters.customRange, 
                              to: date 
                            })
                          }
                          initialFocus
                          disabled={(date) => 
                            filters.customRange.from 
                              ? date < filters.customRange.from 
                              : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Organization</label>
                <Select
                  value={filters.organization}
                  onValueChange={(value) => handleFilterChange('organization', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATIONS.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Region</label>
                <Select
                  value={filters.region}
                  onValueChange={(value) => handleFilterChange('region', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_CRITERIA.map((criteria) => (
                      <SelectItem key={criteria.id} value={criteria.id}>
                        {criteria.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        {/* Global Leaderboard */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Global Leaderboard</CardTitle>
                  <CardDescription>
                    {formatDateRange()} • {leaderboardData?.total || 0} participants
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getUserPosition() && (
                    <Badge variant="outline" className="flex items-center">
                      <FiUserCheck className="mr-1 h-4 w-4" />
                      Your rank: {getUserPosition()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : leaderboardData?.leaderboard?.length > 0 ? (
                <div className="space-y-3">
                  {leaderboardData.leaderboard.map((entry, index) => (
                    <div 
                      key={entry.user.id}
                      className={`flex items-center p-4 rounded-lg border ${
                        entry.user.id === session?.user?.id 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center w-8">
                        <span className={`font-medium ${
                          index < 3 ? 'text-lg' : 'text-muted-foreground'
                        }`}>
                          {getRankIcon(index + 1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center flex-1 min-w-0">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={entry.user.image} alt={entry.user.name} />
                          <AvatarFallback>
                            {entry.user.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {entry.user.name}
                            {entry.user.id === session?.user?.id && (
                              <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <span className="truncate">
                              {entry.user.organization || 'No organization'}
                            </span>
                            {entry.user.region && (
                              <span className="mx-1">•</span>
                            )}
                            <span>{entry.user.region}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="font-semibold">
                          {getMetricValue(entry, filters.sortBy).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {SORT_CRITERIA.find(c => c.id === filters.sortBy)?.name || 'Points'}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(entry.user);
                            setShowRewardsModal(true);
                          }}
                        >
                          <FiGift className="h-4 w-4" />
                          <span className="sr-only">Award</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for the selected filters.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {leaderboardData?.leaderboard?.length || 0} of {leaderboardData?.total || 0} participants
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled={!leaderboardData?.hasPreviousPage}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!leaderboardData?.hasNextPage}>
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Friends Leaderboard */}
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Friends Leaderboard</CardTitle>
              <CardDescription>
                Compare your progress with friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FiUsers className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>Connect with friends to see how you compare!</p>
                <Button variant="outline" className="mt-4">
                  Invite Friends
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historical Leaderboard */}
        <TabsContent value="historical">
          <Card>
            <CardHeader>
              <CardTitle>Historical Leaderboards</CardTitle>
              <CardDescription>
                View past leaderboard snapshots
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicalData?.length > 0 ? (
                <div className="space-y-6">
                  {historicalData.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">
                            {snapshot.timeRange === 'daily' ? 'Daily' : 
                             snapshot.timeRange === 'weekly' ? 'Weekly' : 'Monthly'} Leaderboard
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(snapshot.startDate), 'MMM d, yyyy')} - {format(parseISO(snapshot.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                          // View snapshot details
                          console.log('Viewing snapshot:', snapshot.id);
                        }}>
                          View Details
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {snapshot.topPerformers.slice(0, 3).map((user, index) => (
                          <div key={user.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              <span className="font-medium">{index + 1}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.totalXp.toLocaleString()} XP
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FiClock className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p>No historical data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rewards</CardTitle>
                  <CardDescription>
                    Manage rewards for top performers
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRewardsModal(true)}
                >
                  <FiGift className="mr-2 h-4 w-4" />
                  Create Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-indigo-50">
                            {reward.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{reward.name}</h4>
                            <p className="text-sm text-muted-foreground">{reward.xp} XP</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Awarded to:</span>
                          <span className="font-medium">24 users</span>
                        </div>
                        <div className="mt-2 flex -space-x-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="text-xs">U{i + 1}</AvatarFallback>
                            </Avatar>
                          ))}
                          {5 < 24 && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{24 - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reward Assignment Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">
                Award {selectedUser ? selectedUser.name : 'User'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Reward</label>
                  <Select
                    value={selectedReward}
                    onValueChange={setSelectedReward}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a reward" />
                    </SelectTrigger>
                    <SelectContent>
                      {rewards.map((reward) => (
                        <SelectItem key={reward.id} value={reward.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{reward.icon}</span>
                            {reward.name} ({reward.xp} XP)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                  <div className="flex">
                    <FiInfo className="flex-shrink-0 h-5 w-5 mr-2" />
                    <p>This reward will be immediately visible on the user's profile and may include additional benefits.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRewardsModal(false);
                    setSelectedUser(null);
                    setSelectedReward('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignReward}
                  disabled={!selectedReward}
                >
                  Award User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLeaderboard;
