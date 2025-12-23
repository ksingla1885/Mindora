'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Award, BarChart2, TrendingUp, BookOpen, Clock } from 'lucide-react';
import useDPP from '@/hooks/useDPP';
import DPPAnalytics from './DPPAnalytics';
import DPPGamification from './DPPGamification';
import DPPQuestion from './DPPQuestion';

export default function DPPDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('practice');
  
  const {
    dppData,
    isLoading,
    isSubmitting,
    isGenerating,
    analytics,
    gamification,
    userLevel,
    fetchDPP,
    generateDPP,
    submitAnswer,
    skipQuestion,
    refreshAnalytics,
    refreshGamification,
  } = useDPP();

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'analytics') {
      refreshAnalytics();
    } else if (value === 'rewards') {
      refreshGamification();
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = async (assignmentId, answer, timeSpent) => {
    try {
      await submitAnswer(assignmentId, answer, { timeSpent });
      // Refresh data after submission
      fetchDPP();
      refreshAnalytics();
      refreshGamification();
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Handle question skip
  const handleSkipQuestion = async (assignmentId) => {
    try {
      await skipQuestion(assignmentId);
      fetchDPP();
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  };

  // Handle DPP generation
  const handleGenerateDPP = async () => {
    try {
      await generateDPP();
      fetchDPP();
    } catch (error) {
      console.error('Error generating DPP:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="mt-8">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Sign in to access Daily Practice Problems</h2>
        <p className="text-muted-foreground mb-6">Track your progress and improve your skills with personalized practice.</p>
        <Button onClick={() => window.location.href = '/login'}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Practice Problems</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchDPP({ refresh: true })}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dppData?.assignments?.filter(a => a.status === 'completed').length || 0} / {dppData?.assignments?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dppData?.assignments?.length ? `${Math.round((dppData.assignments.filter(a => a.status === 'completed').length / dppData.assignments.length) * 100)}% completed` : 'No assignments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamification?.streak || 0} days</div>
            <p className="text-xs text-muted-foreground">
              {gamification?.streak ? `Keep it up!` : 'Start a new streak today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.accuracy ? `${Math.round(analytics.accuracy * 100)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.performanceTrend === 'improving' ? 'Improving! ' : ''}
              {analytics?.performanceTrend === 'declining' ? 'Needs attention' : 'Overall performance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userLevel || 1}</div>
            <p className="text-xs text-muted-foreground">
              {gamification?.points || 0} points • {gamification?.nextLevelPoints ? gamification.nextLevelPoints - (gamification.points || 0) : 0} to next level
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="practice">
            <BookOpen className="h-4 w-4 mr-2" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart2 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Award className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-4">
          {dppData?.assignments?.length > 0 ? (
            dppData.assignments.map((assignment) => (
              <DPPQuestion
                key={assignment.id}
                assignment={assignment}
                onSubmit={handleSubmitAnswer}
                onSkip={handleSkipQuestion}
                isSubmitting={isSubmitting}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a new set of practice problems to get started.
                </p>
                <Button onClick={handleGenerateDPP} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate DPP'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <DPPAnalytics data={analytics} />
        </TabsContent>

        <TabsContent value="rewards">
          <DPPGamification data={gamification} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
