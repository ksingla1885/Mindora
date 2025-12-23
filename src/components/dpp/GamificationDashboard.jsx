'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Award, Star, Zap, Flame, ArrowUpRight, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GamificationDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dpp/gamification');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); 

  if (loading) {
    return <GamificationSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No gamification data available</p>
      </div>
    );
  }

  const { badges, achievements, leaderboard, userRank, stats, dailyChallenge } = data;
  const currentLevel = Math.floor(Math.sqrt((stats?.points || 0) / 100)) + 1;
  const nextLevelPoints = Math.pow(currentLevel, 2) * 100 - (stats?.points || 0);
  const progressToNextLevel = ((stats?.points || 0) / Math.pow(currentLevel, 2) / 100) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <Trophy className="h-16 w-16" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Level {currentLevel}</CardTitle>
            <CardDescription>Your current level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Points: {stats?.points || 0}</span>
                <span className="font-medium">{nextLevelPoints} to next level</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <Flame className="h-16 w-16" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Current Streak</CardTitle>
            <CardDescription>Days in a row</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-1">
              <span className="text-3xl font-bold">{stats?.currentStreak || 0}</span>
              <span className="text-muted-foreground text-sm mb-1">
                {stats?.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Best: {stats?.maxStreak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <Award className="h-16 w-16" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Ranking</CardTitle>
            <CardDescription>Global leaderboard position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-1">
              <span className="text-3xl font-bold">#{userRank}</span>
              <span className="text-muted-foreground text-sm mb-1">out of 1,000+ students</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userRank <= 10 ? '🏆 Top 10!' : `Keep going!`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>
                {achievements.length} of 42 unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No achievements unlocked yet. Keep practicing!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>
                {badges.length} of 24 collected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No badges earned yet. Complete more questions to earn badges!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Global leaderboard based on points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((user, index) => (
                  <LeaderboardRow 
                    key={user.id} 
                    user={user} 
                    rank={index + 1} 
                    isCurrentUser={user.id === data.userId} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Daily Challenge */}
      {dailyChallenge && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daily Challenge</CardTitle>
                <CardDescription>
                  Complete today's challenge to earn bonus points!
                </CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {dailyChallenge.progress.completed}/{dailyChallenge.progress.total} completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                {dailyChallenge.questions.map((q, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-md border ${
                      q.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : q.submittedAt 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Question {i + 1}</p>
                        <p className="text-sm text-muted-foreground">{q.topic} • {q.difficulty}</p>
                      </div>
                      {q.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : q.submittedAt ? (
                        <span className="text-red-500 text-sm">Incorrect</span>
                      ) : (
                        <Button size="sm" variant="outline">
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-muted-foreground">
                  Resets in: 5h 23m
                </div>
                <Button disabled={dailyChallenge.progress.completed === dailyChallenge.progress.total}>
                  {dailyChallenge.progress.completed === 0 ? 'Start Challenge' : 'Continue'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AchievementCard({ achievement }) {
  return (
    <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Star className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-medium">{achievement.title}</h4>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> {achievement.points}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <div className="flex flex-col items-center text-center space-y-2 p-3">
      <div className="relative">
        <Avatar className="h-16 w-16 border-2 border-yellow-400">
          <AvatarImage src={badge.icon} alt={badge.name} />
          <AvatarFallback className="bg-yellow-100 text-yellow-800">
            {badge.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {badge.rarity === 'RARE' && (
          <div className="absolute -top-1 -right-1">
            <div className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-200">
              RARE
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{badge.name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(badge.awardedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

function LeaderboardRow({ user, rank, isCurrentUser }) {
  const rankColors = {
    1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    2: 'bg-gray-100 text-gray-800 border-gray-200',
    3: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className={`flex items-center p-3 rounded-lg ${isCurrentUser ? 'bg-accent/50' : 'hover:bg-accent/30'} transition-colors`}>
      <div className={`flex items-center justify-center h-8 w-8 rounded-full border ${rankColors[rank] || 'bg-muted'}`}>
        {rank}
      </div>
      <div className="ml-4 flex-1 flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <div className="flex items-center">
            <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
              {user.name} {isCurrentUser && '(You)'}
            </span>
            {rank <= 3 && (
              <span className="ml-2">
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Level {Math.floor(Math.sqrt(user.points / 100)) + 1}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{user.points} pts</div>
        <div className="text-xs text-muted-foreground">
          {user.points - Math.floor(user.points / 100) * 100}/100 to next level
        </div>
      </div>
    </div>
  );
}

function GamificationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
