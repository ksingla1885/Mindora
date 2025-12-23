'use client';

import { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Trophy, Filter, Award, Users, BarChart2, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

export function EnhancedLeaderboard({ testId, userId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [activeTab, setActiveTab] = useState('overall');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: searchQuery,
          timeRange,
          type: activeTab
        });
        
        const response = await fetch(`/api/leaderboard/${testId || ''}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [testId, searchQuery, timeRange, activeTab, pagination.page, pagination.pageSize]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Render rank badge
  const renderRankBadge = (rank) => {
    if (rank === 1) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">🥇 {rank}</Badge>;
    } else if (rank === 2) {
      return <Badge className="bg-gray-300 hover:bg-gray-400 text-gray-800">🥈 {rank}</Badge>;
    } else if (rank === 3) {
      return <Badge className="bg-amber-600 hover:bg-amber-700">🥉 {rank}</Badge>;
    }
    return <span className="text-sm text-muted-foreground">{rank}</span>;
  };

  // Render score with trend
  const renderScoreWithTrend = (score, previousScore) => {
    if (previousScore === undefined) {
      return <span>{score}</span>;
    }
    
    const trend = score - previousScore;
    const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
    const trendClass = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500';
    
    return (
      <div className="flex items-center gap-1">
        <span>{score}</span>
        {trend !== 0 && (
          <span className={`text-xs ${trendClass}`}>
            {trendIcon} {Math.abs(trend)}
          </span>
        )}
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading leaderboard...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="text-destructive">
          <CardTitle>Error loading leaderboard</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="overall" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Overall</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>This Week</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>This Month</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2 opacity-50" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <Card className="bg-muted/50">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={userRank.user.image} alt={userRank.user.name} />
                    <AvatarFallback>
                      {userRank.user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {userRank.rank}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium">{userRank.user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Score: {userRank.score} • Completed: {userRank.completedTests} tests
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{userRank.rankDisplay}</div>
                <div className="text-xs text-muted-foreground">
                  Top {userRank.percentile}% of {userRank.totalParticipants}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                {pagination.total} participants • Updated {format(new Date(), 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => 
                  setPagination(prev => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1)
                  }))
                }
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination(prev => ({
                    ...prev,
                    page: Math.min(
                      Math.ceil(pagination.total / pagination.pageSize),
                      prev.page + 1
                    )
                  }))
                }
                disabled={
                  pagination.page >= Math.ceil(pagination.total / pagination.pageSize)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Tests</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow 
                    key={entry.userId}
                    className={entry.isCurrentUser ? 'bg-muted/50' : ''}
                  >
                    <TableCell className="font-medium">
                      {renderRankBadge(entry.rank)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.user.image} alt={entry.user.name} />
                          <AvatarFallback>
                            {entry.user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {entry.user.name}
                            {entry.isCurrentUser && (
                              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.user.organization || 'No organization'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {renderScoreWithTrend(entry.score, entry.previousScore)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${entry.accuracy}%` }}
                          />
                        </div>
                        <span>{entry.accuracy}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {entry.averageTimeSpent}s
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.testsCompleted}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={entry.streak > 0 ? 'default' : 'secondary'}>
                        {entry.streak} 🔥
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Score
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard[0]?.score || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              by {leaderboard[0]?.user.name || 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.length > 0 
                ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length) 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              across {pagination.total} participants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.filter(u => u.lastActive >= format(subDays(new Date(), 7), 'yyyy-MM-dd')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              active in the last 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tests Taken
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.reduce((sum, user) => sum + (user.testsCompleted || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              tests completed in total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
