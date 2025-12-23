import { format, subDays } from 'date-fns';

const API_BASE_URL = '/api/analytics';

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
}

// Helper function to format time in milliseconds to MM:SS format
const formatTime = (ms) => {
  if (!ms) return '0:00';
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60));
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Test Analytics API
export const testAnalyticsApi = {
  // Get test analytics with different report types
  getTestAnalytics: async (reportType = 'overview', startDate, endDate, testId = null) => {
    const params = new URLSearchParams({
      reportType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    if (testId) params.append('testId', testId);
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      return {
        totalAttempts: 1245,
        completedAttempts: 1020,
        averageScore: 72.5,
        abovePassing: 65,
        belowPassing: 35,
        activeTestTakers: 845,
        newTestTakers: 124,
        trends: Array.from({ length: 30 }, (_, i) => ({
          date: subDays(new Date(), 29 - i).toISOString(),
          score: 65 + Math.random() * 15,
          completionRate: 70 + Math.random() * 20,
          attempts: 30 + Math.floor(Math.random() * 20)
        })),
        performanceByType: [
          { type: 'Quiz', averageScore: 78, count: 450 },
          { type: 'Exam', averageScore: 65, count: 320 },
          { type: 'Practice', averageScore: 82, count: 375 },
          { type: 'Assessment', averageScore: 70, count: 100 }
        ]
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/test/analytics?${params}`);
    return handleResponse(response);
  },
  
  // Get detailed question analytics
  getQuestionAnalytics: async (testId, questionId) => {
    const response = await fetch(`${API_BASE_URL}/test/questions/${questionId}?testId=${testId}`);
    return handleResponse(response);
  },

  // Get knowledge gap analysis with enhanced data structure
  getKnowledgeGaps: async (testId, startDate, endDate, threshold = 0.5) => {
    const params = new URLSearchParams({
      testId: testId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      threshold: threshold.toString(),
    });
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      const topics = [
        'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics',
        'Reading Comprehension', 'Grammar', 'Vocabulary', 'Writing Skills',
        'Chemical Reactions', 'Atomic Structure', 'Organic Chemistry',
        'Mechanics', 'Electricity', 'Thermodynamics', 'Waves',
        'Cell Biology', 'Genetics', 'Evolution', 'Ecology'
      ];
      
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const resourceTypes = ['Video', 'Article', 'Practice', 'Worksheet', 'Lesson'];
      
      return Array.from({ length: 15 }, (_, i) => {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const errorRate = 0.3 + Math.random() * 0.6; // Between 30% and 90%
        
        return {
          id: `gap-${i + 1}`,
          topic,
          errorRate,
          affectedStudents: Math.floor(10 + Math.random() * 1000),
          relatedQuestions: Math.floor(3 + Math.random() * 15),
          relatedConcepts: Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => {
            const concept = topics[Math.floor(Math.random() * topics.length)];
            return concept === topic ? topics[(topics.indexOf(topic) + 1) % topics.length] : concept;
          }),
          recommendedResources: Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, j) => ({
            id: `res-${i}-${j}`,
            title: `${topic} ${resourceTypes[Math.floor(Math.random() * resourceTypes.length)]} ${j + 1}`,
            type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
            difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            url: `#/resources/${topic.toLowerCase().replace(/\s+/g, '-')}-${j + 1}`
          }))
        };
      }).sort((a, b) => b.errorRate - a.errorRate);
    }
    
    const response = await fetch(`${API_BASE_URL}/test/knowledge-gaps?${params}`);
    const data = await handleResponse(response);
    
    // Transform data to match expected format
    return data.map(gap => ({
      id: gap.id,
      topic: gap.topicName,
      errorRate: gap.errorRate,
      affectedStudents: gap.affectedUserCount,
      relatedQuestions: gap.questionCount,
      relatedConcepts: gap.relatedConcepts || [],
      recommendedResources: gap.recommendedResources?.map(r => ({
        id: r.id,
        title: r.title,
        type: r.resourceType,
        url: r.url,
        difficulty: r.difficulty
      })) || []
    }));
  },

  // Get detailed question performance with filters
  getQuestionPerformance: async (testId, startDate, endDate, filters = {}) => {
    const params = new URLSearchParams({
      testId: testId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...filters
    });
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const questionTypes = ['Multiple Choice', 'True/False', 'Short Answer', 'Essay'];
      const topics = ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'];
      
      return Array.from({ length: 25 }, (_, i) => {
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        const correctRate = 0.3 + Math.random() * 0.7; // 30% to 100%
        const avgTime = 30 + Math.random() * 300; // 30s to 5.5m
        
        return {
          id: `q-${i + 1}`,
          text: `Sample question about ${topics[Math.floor(Math.random() * topics.length)]} (${i + 1})`,
          difficulty,
          type: questionTypes[Math.floor(Math.random() * questionTypes.length)],
          topic: topics[Math.floor(Math.random() * topics.length)],
          correctPercentage: Math.round(correctRate * 100),
          avgTimeSpent: Math.round(avgTime),
          attempts: Math.floor(10 + Math.random() * 500),
          learningObjectives: Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, j) => 
            `LO-${i + 1}-${j + 1}: Understand ${topics[Math.floor(Math.random() * topics.length)]}`
          )
        };
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/test/question-performance?${params}`);
    const data = await handleResponse(response);
    
    // Transform data to match expected format
    return data.questions?.map(q => ({
      id: q.questionId,
      text: q.questionText,
      difficulty: q.difficultyLevel,
      correctPercentage: q.correctAnswerRate * 100,
      avgTimeSpent: q.averageTimeSpentSeconds,
      attempts: q.attemptCount,
      topic: q.topic,
      learningObjectives: q.learningObjectives || []
    })) || [];
  },

  // Get time spent analysis with statistics
  getTimeSpentAnalysis: async (testId, startDate, endDate) => {
    const params = new URLSearchParams({
      testId: testId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      const avgTimeMs = 60000 + Math.random() * 300000; // 1-6 minutes
      const fastestMs = avgTimeMs * (0.3 + Math.random() * 0.4); // 30-70% of average
      const slowestMs = avgTimeMs * (1.3 + Math.random() * 0.7); // 130-200% of average
      
      return {
        averageTimeSpent: formatTime(avgTimeMs),
        fastestTime: formatTime(fastestMs),
        slowestTime: formatTime(slowestMs),
        timeDistribution: [
          { timeRange: '0-30s', count: Math.floor(Math.random() * 50), percentage: Math.random() * 10 },
          { timeRange: '30s-1m', count: Math.floor(Math.random() * 100), percentage: 5 + Math.random() * 15 },
          { timeRange: '1-2m', count: Math.floor(Math.random() * 150), percentage: 20 + Math.random() * 20 },
          { timeRange: '2-3m', count: Math.floor(Math.random() * 200), percentage: 30 + Math.random() * 20 },
          { timeRange: '3-5m', count: Math.floor(Math.random() * 150), percentage: 20 + Math.random() * 15 },
          { timeRange: '5m+', count: Math.floor(Math.random() * 100), percentage: 5 + Math.random() * 10 }
        ]
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/test/time-spent?${params}`);
    const data = await handleResponse(response);
    
    return {
      averageTimeSpent: formatTime(data.averageTimeSpentMs),
      fastestTime: formatTime(data.fastestTimeMs),
      slowestTime: formatTime(data.slowestTimeMs),
      timeDistribution: data.timeDistribution?.map(item => ({
        timeRange: item.timeRange,
        count: item.count,
        percentage: item.percentage * 100
      })) || []
    };
  },

  // Get completion rates with breakdowns
  getCompletionRates: async (testId, startDate, endDate, groupBy = 'day') => {
    const params = new URLSearchParams({
      testId: testId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy
    });
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const trends = Array.from({ length: days }, (_, i) => ({
        date: new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        completionRate: 60 + Math.random() * 30, // 60-90%
        count: 10 + Math.floor(Math.random() * 50)
      }));
      
      const testTypes = [
        { testType: 'Quiz', count: 450, completionRate: 0.85 },
        { testType: 'Exam', count: 320, completionRate: 0.75 },
        { testType: 'Practice', count: 375, completionRate: 0.92 },
        { testType: 'Assessment', count: 100, completionRate: 0.68 }
      ];
      
      const segments = [
        { segmentName: 'New Users', count: 120, completionRate: 0.65 },
        { segmentName: 'Returning Users', count: 380, completionRate: 0.82 },
        { segmentName: 'Premium', count: 210, completionRate: 0.91 },
        { segmentName: 'Free Tier', count: 535, completionRate: 0.72 }
      ];
      
      return {
        overallRate: 0.78,
        trends,
        byType: testTypes.map(t => ({
          type: t.testType,
          completionRate: t.completionRate * 100,
          count: t.count
        })),
        bySegment: segments.map(s => ({
          segment: s.segmentName,
          completionRate: s.completionRate * 100,
          count: s.count
        }))
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/test/completion-rates?${params}`);
    const data = await handleResponse(response);
    
    return {
      overallRate: data.overallCompletionRate * 100,
      trends: data.trends?.map(item => ({
        date: item.date,
        completionRate: item.completionRate * 100,
        count: item.count
      })) || [],
      byType: data.breakdownByType?.map(item => ({
        type: item.testType,
        completionRate: item.completionRate * 100,
        count: item.count
      })) || [],
      bySegment: data.breakdownBySegment?.map(item => ({
        segment: item.segmentName,
        completionRate: item.completionRate * 100,
        count: item.count
      })) || []
    };
  },

  // Get difficulty analysis
  getDifficultyAnalysis: async (testId, startDate, endDate) => {
    const params = new URLSearchParams({
      testId: testId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const questionTypes = ['Multiple Choice', 'True/False', 'Short Answer', 'Essay'];
      
      return {
        distribution: [
          { difficultyLevel: 'Easy', questionCount: 45, percentage: 0.45 },
          { difficultyLevel: 'Medium', questionCount: 35, percentage: 0.35 },
          { difficultyLevel: 'Hard', questionCount: 20, percentage: 0.20 }
        ],
        performance: [
          { 
            difficulty: 'Easy', 
            correctPercentage: 85, 
            avgTimeSpent: 45,
            questionCount: 45
          },
          { 
            difficulty: 'Medium', 
            correctPercentage: 65, 
            avgTimeSpent: 120,
            questionCount: 35
          },
          { 
            difficulty: 'Hard', 
            correctPercentage: 35, 
            avgTimeSpent: 210,
            questionCount: 20
          }
        ]
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/test/difficulty-analysis?${params}`);
    const data = await handleResponse(response);
    
    return {
      distribution: data.difficultyDistribution?.map(item => ({
        difficulty: item.difficultyLevel,
        count: item.questionCount,
        percentage: item.percentage * 100
      })) || [],
      performance: data.performanceMetrics?.map(item => ({
        difficulty: item.difficultyLevel,
        correctPercentage: item.correctAnswerRate * 100,
        avgTimeSpent: item.averageTimeSpentSeconds,
        questionCount: item.questionCount
      })) || []
    };
  },

  // Get comparative analysis
  getComparativeAnalysis: async (testId, startDate, endDate, compareWith) => {
    const params = new URLSearchParams({
      testId: testId || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      compareWith: compareWith || ''
    });
    
    const response = await fetch(`${API_BASE_URL}/test/comparative?${params}`);
    return handleResponse(response);
  },

  // Export test analytics
  exportTestAnalytics: async (testId, format = 'csv', startDate, endDate, reportType = 'full') => {
    const params = new URLSearchParams({
      testId: testId || '',
      format,
      reportType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/test/export?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }
    return response.blob();
  },
};

// Financial Analytics API
export const financialAnalyticsApi = {
  // Get financial overview with metrics
  getFinancialOverview: async (startDate, endDate, groupBy = 'day') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy,
    });

    const response = await fetch(`${API_BASE_URL}/financial/overview?${params}`);
    return handleResponse(response);
  },
  
  // Get revenue by product
  getRevenueByProduct: async (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/financial/revenue-by-product?${params}`);
    return handleResponse(response);
  },
  
  // Get payment analytics
  getPaymentAnalytics: async (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/financial/payment-analytics?${params}`);
    return handleResponse(response);
  },
  
  // Get tax summary
  getTaxSummary: async (startDate, endDate, country = null) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    if (country) params.append('country', country);
    
    const response = await fetch(`${API_BASE_URL}/financial/tax-summary?${params}`);
    return handleResponse(response);
  },
  
  // Get revenue trends
  getRevenueTrends: async (startDate, endDate, interval = 'day') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      interval,
    });
    
    const response = await fetch(`${API_BASE_URL}/financial/revenue-trends?${params}`);
    return handleResponse(response);
  },
  
  // Get top customers
  getTopCustomers: async (startDate, endDate, limit = 10) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: limit.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/financial/top-customers?${params}`);
    return handleResponse(response);
  },
  
  // Export financial report
  exportFinancialReport: async (reportType, format = 'csv', startDate, endDate) => {
    const params = new URLSearchParams({
      type: reportType,
      format,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/financial/export?${params}`);
    return handleResponse(response);
  },
  
  // Get financial products
  getFinancialProducts: async (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/financial/products?${params}`);
    return handleResponse(response);
  },
};

// Subscription Analytics API
export const subscriptionAnalyticsApi = {
  // Get comprehensive subscription metrics
  getSubscriptionMetrics: async (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      include: 'mrr,arpa,ltv,churn'
    });

    try {
      const response = await fetch(`${API_BASE_URL}/subscription/metrics?${params}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching subscription metrics:', error);
      // Return mock data in development if API call fails
      if (process.env.NODE_ENV === 'development') {
        return {
          totalSubscribers: 1245,
          newSubscribers: 145,
          churnedSubscribers: 32,
          netChange: 113,
          mrr: 24500,
          arr: 294000,
          arpu: 19.68,
          churnRate: 2.6,
          ltv: 2361.54,
          growthData: Array.from({ length: 12 }, (_, i) => ({
            period: format(subDays(endDate, (11 - i) * 30), 'MMM yyyy'),
            newSubscriptions: Math.floor(Math.random() * 50) + 80,
            cancellations: Math.floor(Math.random() * 15) + 5,
            netChange: Math.floor(Math.random() * 40) + 30,
          })),
          plans: [
            { id: 'basic', name: 'Basic', price: 9.99, billingCycle: 'month', count: 450 },
            { id: 'pro', name: 'Pro', price: 29.99, billingCycle: 'month', count: 620 },
            { id: 'enterprise', name: 'Enterprise', price: 99.99, billingCycle: 'month', count: 175 },
          ],
        };
      }
      throw error;
    }
  },
  
  // Get detailed churn analytics
  getChurnRate: async (startDate, endDate, interval = 'month') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      interval,
      include: 'reasons,cohorts'
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/churn-rate?${params}`);
    return handleResponse(response);
  },
  
  // Get subscription growth metrics
  getSubscriptionGrowth: async (startDate, endDate, interval = 'month', includeMRR = true) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      interval,
      include: includeMRR ? 'mrr,arr' : ''
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/growth?${params}`);
    return handleResponse(response);
  },
  
  // Get subscription plans with metrics
  getSubscriptionPlans: async (includeMetrics = true) => {
    const params = new URLSearchParams();
    if (includeMetrics) params.append('include', 'metrics');
    
    const response = await fetch(`${API_BASE_URL}/subscriptions/plans?${params}`);
    return handleResponse(response);
  },
  
  // Get MRR (Monthly Recurring Revenue) trends
  getMRR: async (startDate, endDate, interval = 'month') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      interval,
      include: 'new,expansion,contraction,churn'
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/mrr?${params}`);
    return handleResponse(response);
  },
  
  // Get ARPU (Average Revenue Per User)
  getARPU: async (startDate, endDate, interval = 'month') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      interval
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/arpu?${params}`);
    return handleResponse(response);
  },
  
  // Get LTV (Lifetime Value) metrics
  getLTV: async (startDate, endDate, cohortBy = 'month') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      cohortBy,
      include: 'cac,payback'
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/ltv?${params}`);
    return handleResponse(response);
  },
  
  // Get subscription retention metrics
  getRetention: async (startDate, endDate, period = 'month') => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      include: 'cohorts,revenue'
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/retention?${params}`);
    return handleResponse(response);
  },
  
  // Get subscription upgrades/downgrades
  getPlanChanges: async (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      include: 'revenue_impact'
    });
    const response = await fetch(`${API_BASE_URL}/subscriptions/plan-changes?${params}`);
    return handleResponse(response);
  },
};

// Common Analytics API
export const analyticsApi = {
  getTimeSeriesData: async (metric, startDate, endDate, interval = 'day') => {
    const params = new URLSearchParams({
      metric,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      interval,
    });

    const response = await fetch(`${API_BASE_URL}/timeseries?${params}`);
    return handleResponse(response);
  },
  
  exportData: async (type, format = 'csv', startDate, endDate) => {
    const params = new URLSearchParams({
      type,
      format,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await fetch(`${API_BASE_URL}/export?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${type}-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};

// Mock data generators for development
const generateMockTimeSeries = (days = 30, min = 100, max = 1000) => {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd'),
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }));
};

// Mock API for development
export const mockAnalyticsApi = {
  // Revenue data
  getRevenueData: async (days = 30) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 10000) + 1000,
        transactions: Math.floor(Math.random() * 100) + 10,
      });
    }
    
    return data;
  },
  
  // User activity
  getUserActivity: async (days = 30) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);
      data.push({
        date: date.toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 500) + 100,
        newUsers: Math.floor(Math.random() * 50) + 5,
        sessions: Math.floor(Math.random() * 800) + 200,
      });
    }
    
    return data;
  },
  
  // Financial overview
  getFinancialOverview: async (startDate, endDate) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const revenue = Array(days).fill(0).map(() => Math.floor(Math.random() * 10000) + 1000);
    const totalRevenue = revenue.reduce((a, b) => a + b, 0);
    
    return {
      totalRevenue,
      totalTransactions: Math.floor(totalRevenue / 100) * (0.5 + Math.random() * 2),
      averageOrderValue: Math.floor(totalRevenue / (days * (0.5 + Math.random()))),
      refunds: Math.floor(totalRevenue * 0.03 * (0.8 + Math.random() * 0.4)),
      netRevenue: Math.floor(totalRevenue * 0.85),
      paymentMethods: {
        credit_card: Math.floor(Math.random() * 50) + 30,
        paypal: Math.floor(Math.random() * 30) + 10,
        bank_transfer: Math.floor(Math.random() * 20) + 5,
        other: Math.floor(Math.random() * 10) + 1,
      },
      revenueByProduct: [
        { name: 'Basic Plan', value: Math.floor(Math.random() * 40) + 20 },
        { name: 'Pro Plan', value: Math.floor(Math.random() * 30) + 10 },
        { name: 'Enterprise', value: Math.floor(Math.random() * 20) + 5 },
        { name: 'Add-ons', value: Math.floor(Math.random() * 10) + 1 },
      ],
    };
  },
  
  // Payment analytics
  getPaymentAnalytics: async (startDate, endDate) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      successRate: 95 + Math.random() * 4, // 95-99%
      failureRate: 1 + Math.random() * 3,  // 1-4%
      paymentMethods: {
        credit_card: {
          success: 92 + Math.random() * 6,
          failed: 8 - Math.random() * 6,
          count: Math.floor(Math.random() * 1000) + 500,
        },
        paypal: {
          success: 90 + Math.random() * 8,
          failed: 10 - Math.random() * 8,
          count: Math.floor(Math.random() * 500) + 200,
        },
      },
      commonErrors: [
        { code: 'card_declined', count: Math.floor(Math.random() * 50) + 20 },
        { code: 'insufficient_funds', count: Math.floor(Math.random() * 30) + 10 },
        { code: 'expired_card', count: Math.floor(Math.random() * 20) + 5 },
        { code: 'processing_error', count: Math.floor(Math.random() * 15) + 2 },
      ],
    };
  },
  
  // Tax summary
  getTaxSummary: async (startDate, endDate, country = null) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const countries = country 
      ? [country] 
      : ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP'];
    
    return countries.map(c => ({
      country: c,
      totalSales: Math.floor(Math.random() * 100000) + 50000,
      taxCollected: Math.floor(Math.random() * 20000) + 5000,
      taxRate: 5 + Math.floor(Math.random() * 20),
      taxableAmount: Math.floor(Math.random() * 90000) + 40000,
    }));
  },
  
  // Revenue trends
  getRevenueTrends: async (startDate, endDate, interval = 'day') => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 10000) + 1000,
        newCustomers: Math.floor(Math.random() * 50) + 5,
        averageOrderValue: Math.floor(Math.random() * 200) + 50,
      });
    }
    
    return data;
  },
  
  // Top customers
  getTopCustomers: async (startDate, endDate, limit = 10) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const customers = [];
    const names = ['John', 'Jane', 'Robert', 'Emily', 'Michael', 'Sarah', 'David', 'Jennifer', 'James', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    for (let i = 0; i < limit; i++) {
      const firstName = names[Math.floor(Math.random() * names.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const revenue = Math.floor(Math.random() * 10000) + 1000;
      
      customers.push({
        id: `cust_${i + 1}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        revenue,
        orders: Math.floor(Math.random() * 20) + 1,
        lastPurchase: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
        aov: Math.floor(revenue / (Math.floor(Math.random() * 10) + 1)),
      });
    }
    
    return customers.sort((a, b) => b.revenue - a.revenue);
  },
};
