import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Performance metrics tracker
const performanceMetrics = {
  startTime: 0,
  markStart() {
    this.startTime = performance.now();
  },
  markEnd(eventName) {
    const duration = performance.now() - this.startTime;
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: eventName,
        value: Math.round(duration),
        event_category: 'Performance',
      });
    }
    return duration;
  },
  logError(error, context = {}) {
    console.error('DPP Error:', { error, ...context });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        ...context,
      });
    }
  },
};

export function useDPP() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMounted = useRef(true);
  
  // Track component mount state for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Safe state update wrapper
  const safeSetState = useCallback((setter, ...args) => {
    if (isMounted.current) {
      setter(...args);
    }
  }, []);
  
  const [dppData, setDppData] = useState({
    config: null,
    assignments: [],
    stats: null,
    isLoading: true,
    error: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [analytics, setAnalytics] = useState({
    stats: null,
    isLoading: false,
    error: null,
  });
  
  const [gamification, setGamification] = useState({
    badges: [],
    achievements: [],
    leaderboard: [],
    userRank: 0,
    dailyChallenge: null,
    isLoading: false,
    error: null,
  });
  
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview');

  // Fetch DPP data with pagination and caching
  const fetchDPP = useCallback(async (options = {}) => {
    if (status !== 'authenticated') return;
    
    const {
      includeCompleted = false,
      refresh = false,
      page = 1,
      pageSize = 20,
      append = false,
      retryCount = 0,
    } = options;
    
    // Don't fetch if already loading more data
    if (dppData.isLoadingMore) return;
    
    try {
      performanceMetrics.markStart();
      setDppData(prev => ({
        ...prev,
        isLoading: !append,
        isLoadingMore: append,
        error: null,
      }));
      
      const params = new URLSearchParams({
        page,
        pageSize,
        ...(includeCompleted && { includeCompleted: 'true' }),
        ...(refresh && { refresh: 'true' }),
      });
      
      const response = await fetch(`/api/dpp?${params.toString()}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const duration = performanceMetrics.markEnd('fetch_dpp');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch DPP');
      }
      
      const data = await response.json();
      
      setDppData(prev => ({
        ...prev,
        config: data.config || prev.config,
        assignments: append 
          ? [...prev.assignments, ...(data.assignments || [])]
          : (data.assignments || []),
        stats: data.stats || prev.stats,
        hasMore: (data.assignments?.length || 0) >= pageSize,
        page,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      }));
      
      return data;
    } catch (error) {
      performanceMetrics.logError(error, { operation: 'fetchDPP' });
      setDppData(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: error.message,
      }));
      
      // Auto-retry on network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        if (retryCount < 3) {
          setTimeout(() => {
            fetchDPP({ ...options, retryCount: retryCount + 1 });
          }, 1000 * (retryCount + 1));
        }
      }
    }
  }, [status]);

  // Generate new DPP
  const generateDPP = useCallback(async (count) => {
    if (status !== 'authenticated' || isGenerating) return;
    
    try {
      setIsGenerating(true);
      const response = await fetch('/api/dpp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate DPP');
      }
      
      // Refresh the DPP data
      await fetchDPP(true);
      return true;
    } catch (error) {
      console.error('Error generating DPP:', error);
      setDppData(prev => ({
        ...prev,
        error: error.message,
      }));
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [status, isGenerating, fetchDPP]);

  // Update DPP configuration
  const updateDPPConfig = useCallback(async (updates) => {
    if (status !== 'authenticated') return false;
    
    try {
      const response = await fetch('/api/dpp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update DPP configuration');
      }
      
      const data = await response.json();
      setDppData(prev => ({
        ...prev,
        config: data.config,
      }));
      
      // Calculate user level and progress
      const userLevel = useMemo(() => {
        if (!analytics.stats?.points) return { level: 1, progress: 0 };
        const points = analytics.stats.points;
        const level = Math.floor(Math.sqrt(points / 100)) + 1;
        const nextLevelPoints = Math.pow(level, 2) * 100;
        const currentLevelPoints = Math.pow(level - 1, 2) * 100;
        const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
        return { level, progress };
      }, [analytics.stats?.points]);
      
      return true;
    } catch (error) {
      console.error('Error updating DPP config:', error);
      setDppData(prev => ({
        ...prev,
        error: error.message,
      }));
      return false;
    }
  }, [status, analytics.stats?.points]);

  // Submit an answer
  const submitAnswer = useCallback(async (assignmentId, answer, metadata = {}) => {
    if (status !== 'authenticated' || isSubmitting) return null;
    
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/dpp/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          answer,
          metadata,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit answer');
      }
      
      const { result } = await response.json();
      
      // Update local state
      setDppData(prev => ({
        ...prev,
        assignments: prev.assignments.map(a => 
          a.id === assignmentId ? { ...a, ...result } : a
        ),
      }));
      
      // Refresh stats
      await fetchDPP(true);
      
      return result;
    } catch (error) {
      console.error('Error submitting answer:', error);
      setDppData(prev => ({
        ...prev,
        error: error.message,
      }));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [status, isSubmitting, fetchDPP]);

  // Skip a question
  const skipQuestion = useCallback(async (assignmentId) => {
    if (status !== 'authenticated' || isSkipping) return false;
    
    try {
      setIsSkipping(true);
      const response = await fetch('/api/dpp/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to skip question');
      }
      
      // Refresh the DPP data
      await fetchDPP(true);
      return true;
    } catch (error) {
      console.error('Error skipping question:', error);
      setDppData(prev => ({
        ...prev,
        error: error.message,
      }));
      return false;
    } finally {
      setIsSkipping(false);
    }
  }, [status, isSkipping, fetchDPP]);

  // Generate practice test
  const generatePracticeTest = useCallback(async (options = {}) => {
    if (status !== 'authenticated' || isGenerating) return [];
    
    try {
      setIsGenerating(true);
      const params = new URLSearchParams();
      if (options.count) params.append('count', options.count);
      if (options.subjects?.length) params.append('subjects', options.subjects.join(','));
      if (options.topics?.length) params.append('topics', options.topics.join(','));
      if (options.difficulties?.length) params.append('difficulties', options.difficulties.join(','));
      
      const response = await fetch(`/api/dpp/practice-test?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate practice test');
      }
      
      const data = await response.json();
      return data.questions || [];
    } catch (error) {
      console.error('Error generating practice test:', error);
      setDppData(prev => ({
        ...prev,
        error: error.message,
      }));
      return [];
    } finally {
      setIsGenerating(false);
    }
    if (status !== 'authenticated' || isGenerating) return [];
    
    try {
      setIsGenerating(true);
      const params = new URLSearchParams();
      if (options.count) params.append('count', options.count);
      if (options.subjects?.length) params.append('subjects', options.subjects.join(','));
      if (options.topics?.length) params.append('topics', options.topics.join(','));
      if (options.difficulties?.length) params.append('difficulties', options.difficulties.join(','));
      
      const response = await fetch(`/api/dpp/practice-test?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate practice test');
      }
      
      const data = await response.json();
      return data.questions || [];
    } catch (error) {
      console.error('Error generating practice test:', error);
      setDppData(prev => ({
        ...prev,
        error: error.message,
      }));
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [status, isGenerating]);

  // Process analytics data in chunks to prevent UI blocking
  const processAnalyticsData = useCallback((rawData) => {
    // Use requestIdleCallback to process data when the main thread is idle
    if (window.requestIdleCallback) {
      return new Promise((resolve) => {
        requestIdleCallback(() => {
          const processedData = {
            ...rawData,
            // Process large datasets in chunks
            weeklyData: rawData.weeklyData?.map(week => ({
              ...week,
              // Process only what's needed for the current view
              topics: week.topics?.slice(0, 10), // Limit to top 10 topics
            })) || [],
          };
          resolve(processedData);
        }, { timeout: 1000 }); // Max 1 second to process
      });
    }
    return rawData; // Fallback for browsers that don't support requestIdleCallback
  }, []);

  // Memoize analytics data processing
  const memoizedAnalytics = useMemo(() => {
    if (!analytics.stats) return null;
    return processAnalyticsData(analytics.stats);
  }, [analytics.stats, processAnalyticsData]);

  // Fetch analytics data with error boundaries and retry logic
  const fetchAnalytics = useCallback(async (retryCount = 0) => {
    if (status !== 'authenticated' || analytics.isLoading) return;
    
    try {
      setAnalytics(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Add cache busting and request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('/api/dpp/analytics', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch analytics');
      }
      
      const data = await response.json();
      const processedData = await processAnalyticsData(data);
      
      setAnalytics(prev => ({
        ...prev,
        stats: processedData,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  }, [status]);

  // Process gamification data efficiently
  const processGamificationData = useCallback((data) => {
    // Use web worker for heavy processing if available
    if (window.Worker) {
      return new Promise((resolve) => {
        const worker = new Worker('/workers/gamification-processor.js');
        worker.postMessage(data);
        
        worker.onmessage = (e) => {
          worker.terminate();
          resolve(e.data);
        };
        
        // Fallback in case worker times out
        setTimeout(() => {
          worker.terminate();
          resolve(processGamificationSync(data));
        }, 1000);
      });
    }
    return processGamificationSync(data);
  }, []);
  
  // Synchronous fallback for gamification processing
  const processGamificationSync = (data) => {
    return {
      ...data,
      leaderboard: data.leaderboard?.slice(0, 50) || [], // Limit leaderboard to top 50
      badges: data.badges?.map(badge => ({
        ...badge,
        // Optimize badge data structure
        icon: badge.icon || 'default-badge',
      })) || [],
      achievements: data.achievements?.map(ach => ({
        ...ach,
        // Only include necessary achievement data
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        earned: ach.earned,
        progress: ach.progress,
      })) || [],
    };
  };

  // Memoize processed gamification data
  const memoizedGamification = useMemo(() => {
    if (!gamification.badges?.length && !gamification.achievements?.length) return null;
    return processGamificationSync(gamification);
  }, [gamification]);

  // Fetch gamification data with retry and caching
  const fetchGamification = useCallback(async (retryCount = 0) => {
    if (status !== 'authenticated' || gamification.isLoading) return;
    
    try {
      setGamification(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        lastFetched: prev.lastFetched,
      }));
      
      // Check cache first
      const cacheKey = `gamification_${session.user.id}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
      
      if (cachedData && cacheExpiry > Date.now()) {
        const data = JSON.parse(cachedData);
        setGamification(prev => ({
          ...prev,
          ...data,
          isLoading: false,
          lastFetched: Date.now(),
        }));
        return;
      }
      
      // Fetch fresh data
      const response = await fetch('/api/dpp/gamification', {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gamification data');
      }
      
      const data = await response.json();
      const processedData = await processGamificationData(data);
      
      // Cache the response
      sessionStorage.setItem(cacheKey, JSON.stringify(processedData));
      localStorage.setItem(`${cacheKey}_expiry`, Date.now() + (5 * 60 * 1000)); // 5 min expiry
      
      setGamification(prev => ({
        ...prev,
        ...processedData,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      }));
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setGamification(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
    }
  }, [status, session?.user?.id]);

  // Memoize the fetch functions to prevent unnecessary re-renders
  const memoizedFetchDPP = useCallback(fetchDPP, [status, dppData.isLoadingMore]);
  const memoizedFetchAnalytics = useCallback(fetchAnalytics, [status]);
  const memoizedFetchGamification = useCallback(fetchGamification, [status, gamification.isLoading]);
  
  // Initial data loading
  useEffect(() => {
    if (status === 'authenticated') {
      memoizedFetchDPP();
      memoizedFetchAnalytics();
      memoizedFetchGamification();
    }
  }, [status, memoizedFetchDPP, memoizedFetchAnalytics, memoizedFetchGamification]);

  // Only expose necessary values and functions
  return useMemo(() => ({
    // Data
    dppData: {
      ...dppData,
      // Only expose necessary assignment data
      assignments: dppData.assignments.map(assignment => ({
        id: assignment.id,
        subject: assignment.subject,
        topic: assignment.topic,
        dueDate: assignment.dueDate,
        status: assignment.status,
        progress: assignment.progress,
      })),
    },
    
    // Loading states
    isLoading: dppData.isLoading || analytics.isLoading || gamification.isLoading,
    isLoadingMore: dppData.isLoadingMore,
    isSubmitting,
    isGenerating,
    isAuthenticated: status === 'authenticated',
    
    // Analytics (memoized)
    analytics: memoizedAnalytics || {
      performanceTrends: [],
      subjectBreakdown: [],
      topicPerformance: [],
      dailyActivity: [],
      recommendations: [],
      isLoading: analytics.isLoading,
      error: analytics.error,
    },
    
    // Gamification (memoized)
    gamification: memoizedGamification || {
      points: 0,
      level: 1,
      levelProgress: 0,
      nextLevelPoints: 100,
      streak: 0,
      badges: [],
      achievements: [],
      leaderboard: [],
      dailyChallenge: null,
      isLoading: gamification.isLoading,
      error: gamification.error,
    },
    
    // User level (memoized)
    userLevel,
    
    // Memoized functions
    fetchDPP: memoizedFetchDPP,
    generateDPP: useCallback(generateDPP, [status, isGenerating]),
    updateDPP: useCallback(updateDPP, [status]),
    submitAnswer: useCallback(submitAnswer, [status, isSubmitting]),
    skipQuestion: useCallback(skipQuestion, [status]),
    generatePracticeTest: useCallback(generatePracticeTest, [status, isGenerating]),
    
    // Refresh functions
    refreshAnalytics: memoizedFetchAnalytics,
    refreshGamification: memoizedFetchGamification,
  }), [
    dppData, 
    isSubmitting, 
    isGenerating, 
    status,
    memoizedAnalytics, 
    analytics.isLoading, 
    analytics.error,
    memoizedGamification,
    gamification.isLoading,
    gamification.error,
    userLevel,
    memoizedFetchDPP,
    memoizedFetchAnalytics,
    memoizedFetchGamification,
    generateDPP,
    updateDPP,
    submitAnswer,
    skipQuestion,
    generatePracticeTest
  ]);
}
