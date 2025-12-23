'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DPPList, DPPCard } from '@/components/dpp';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Award, Flame, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function DPPMainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mock data - replace with actual API calls
  const [dppData, setDppData] = useState({
    today: null,
    upcoming: [],
    completed: [],
  });

  const [stats, setStats] = useState({
    currentStreak: 5,
    maxStreak: 10,
    weeklyGoal: 5,
    completedThisWeek: 3,
    totalCompleted: 42,
    accuracy: 0.82,
  });
  const [answer, setAnswer] = useState('');

  // Set up WebSocket for real-time updates
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    // In a real app, you would set up a WebSocket connection here
    // For example:
    // const ws = new WebSocket(`wss://your-api.com/ws?token=${session.accessToken}`);
    // 
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'DPP_UPDATED') {
    //     fetchDPPData();
    //   }
    // };
    // 
    // return () => ws.close();
    
    // For now, we'll use polling as a fallback
    const pollInterval = setInterval(() => {
      fetchDPPData();
    }, 5 * 60 * 1000); // Poll every 5 minutes
    
    return () => clearInterval(pollInterval);
  }, [status, session?.accessToken]);

  // Redirect if not authenticated and fetch initial data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dpp');
    } else if (status === 'authenticated') {
      fetchDPPData();
    }
  }, [status, router]);

  // Fetch DPP data from API
  const fetchDPPData = useCallback(async (refresh = false) => {
    if (status !== 'authenticated') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch DPP data and stats in parallel
      const [dppRes, statsRes] = await Promise.all([
        fetch(`/api/dpp?refresh=${refresh}&includeCompleted=true`),
        fetch('/api/dpp/stats')
      ]);
      
      if (!dppRes.ok || !statsRes.ok) {
        const dppError = await dppRes.json().catch(() => ({}));
        const statsError = await statsRes.json().catch(() => ({}));
        throw new Error(dppError.message || statsError.message || 'Failed to fetch DPP data');
      }
      
      const { assignments, config } = await dppRes.json();
      const statsData = await statsRes.json();
      
      // Process assignments into today/upcoming/completed
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      const processedData = {
        today: null,
        upcoming: [],
        completed: []
      };
      
      assignments.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        
        if (assignment.completedAt) {
          processedData.completed.push({
            ...assignment,
            id: assignment.id,
            isCompleted: true,
            score: assignment.score,
            maxScore: assignment.maxScore,
            completedAt: assignment.completedAt
          });
        } else if (dueDate >= todayStart && dueDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)) {
          processedData.today = {
            ...assignment,
            id: assignment.id,
            isCompleted: false,
            isLocked: false
          };
        } else if (dueDate > now) {
          processedData.upcoming.push({
            ...assignment,
            id: assignment.id,
            isCompleted: false,
            isLocked: dueDate > new Date(now.getTime() + 24 * 60 * 60 * 1000) // Lock if not due tomorrow
          });
        }
      });
      
      setDppData(processedData);
      
      // Update stats
      setStats({
        currentStreak: statsData.currentStreak || 0,
        maxStreak: statsData.maxStreak || 0,
        weeklyGoal: config?.dailyLimit * 5 || 5, // Assuming 5 days a week
        completedThisWeek: statsData.completedThisWeek || 0,
        totalCompleted: statsData.totalCompleted || 0,
        accuracy: statsData.averageAccuracy ? statsData.averageAccuracy / 100 : 0
      });
    } catch (err) {
      console.error('Error fetching DPP data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [status, session?.accessToken, router]);

  useEffect(() => {
    fetchDPPData();
  }, [status, session?.accessToken, fetchDPPData]);

  const handleDPPStart = async (dpp) => {
    try {
      // Mark the DPP as started (optional, can be used for analytics)
      await fetch(`/api/dpp/${dpp.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startedAt: new Date().toISOString() })
      });
      
      // Refresh the page data
      router.refresh();
      
      // Navigate to DPP attempt page
      router.push(`/dpp/attempt/${dpp.id}`);
    } catch (error) {
      console.error('Error starting DPP:', error);
      setError('Failed to start DPP. Please try again.');
    }
  };
  
  // Handle refresh of DPP data
  const handleRefresh = () => {
    fetchDPPData(true); // Force refresh
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start" role="alert">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading DPP data</h3>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAnswer = async (selectedAnswer) => {
    if (!dppData.today) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dpp/${dppData.today.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: selectedAnswer }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const result = await response.json();
      
      // Update the today's DPP
      setDppData(prev => ({
        ...prev,
        today: {
          ...prev.today,
          isCompleted: true,
          isCorrect: result.isCorrect,
          completedAt: new Date().toISOString()
        }
      }));

      // Update stats
      setStats(prev => ({
        ...prev,
        currentStreak: result.streak?.current || prev.currentStreak,
        maxStreak: result.streak?.isNewRecord 
          ? (result.streak?.current || prev.maxStreak)
          : prev.maxStreak,
        completedThisWeek: prev.completedThisWeek + 1,
        totalCompleted: prev.totalCompleted + 1
      }));

    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError('Please enter your answer before submitting.');
      return;
    }
    await handleAnswer(answer);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Daily Practice Problems</h1>
          <p className="text-muted-foreground">Practice daily to strengthen your concepts and track your progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak} days</div>
              <p className="text-xs text-muted-foreground">
                Best: {stats.maxStreak} days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedThisWeek}/{stats.weeklyGoal}</div>
              <div className="mt-2">
                <Progress value={(stats.completedThisWeek / stats.weeklyGoal) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompleted}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(stats.accuracy * 100)}% accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's DPP */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Problem</CardTitle>
            </CardHeader>
            <CardContent>
              {dppData.today ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      {new Date(dppData.today.dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dppData.today.subject}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{dppData.today.title}</h3>
                    <p className="text-muted-foreground">
                      {dppData.today.description || 'No description available'}
                    </p>
                    <div className="pt-2">
                      <Button 
                        onClick={() => handleDPPStart(dppData.today)}
                        className="w-full"
                        disabled={dppData.today.isLocked}
                      >
                        {dppData.today.isLocked ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Available {new Date(dppData.today.dueDate).toLocaleTimeString()}
                          </>
                        ) : (
                          'Start Practice'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No DPP for today</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back tomorrow for a new practice problem or explore past problems.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your DPP completion for this week
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center p-4">
                  <p className="text-muted-foreground">
                    Weekly progress chart will be displayed here
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.completedThisWeek} of {stats.weeklyGoal} completed this week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
