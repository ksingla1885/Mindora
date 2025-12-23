import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';

const useAdminAnalytics = (initialDays = 30) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(initialDays);
  const [data, setData] = useState({
    stats: null,
    enrollmentTrends: [],
    demographics: [],
    revenueData: [],
    coursePerformance: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [overviewRes, demographicsRes, revenueRes] = await Promise.all([
        fetch(`/api/admin/analytics?type=overview&days=${timeRange}`),
        fetch(`/api/admin/analytics?type=demographics`),
        fetch(`/api/admin/analytics?type=revenue&days=${timeRange}`),
      ]);

      if (!overviewRes.ok || !demographicsRes.ok || !revenueRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const overviewData = await overviewRes.json();
      const demographicsData = await demographicsRes.json();
      const revenueData = await revenueRes.json();

      setData({
        stats: overviewData.data.stats,
        enrollmentTrends: overviewData.data.enrollmentTrends,
        demographics: demographicsData.data,
        revenueData: revenueData.data,
        coursePerformance: overviewData.data.topCourses,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format data for charts
  const getFormattedEnrollmentData = useCallback(() => {
    if (!data.enrollmentTrends || data.enrollmentTrends.length === 0) return [];
    
    return data.enrollmentTrends.map(item => ({
      date: format(new Date(item.date), 'MMM d'),
      count: item.count,
    }));
  }, [data.enrollmentTrends]);

  const getFormattedRevenueData = useCallback(() => {
    if (!data.revenueData || data.revenueData.length === 0) return [];
    
    return data.revenueData.map(item => ({
      date: format(new Date(item.date), 'MMM d'),
      amount: item.amount,
    }));
  }, [data.revenueData]);

  const getTopPerformingCourses = useCallback(() => {
    if (!data.coursePerformance || data.coursePerformance.length === 0) return [];
    
    return [...data.coursePerformance]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  }, [data.coursePerformance]);

  const getDemographicData = useCallback(() => {
    if (!data.demographics || data.demographics.length === 0) return [];
    
    return data.demographics.map(item => ({
      name: item.name || 'Unknown',
      value: item.value,
    }));
  }, [data.demographics]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    data: {
      ...data,
      formattedEnrollmentData: getFormattedEnrollmentData(),
      formattedRevenueData: getFormattedRevenueData(),
      topPerformingCourses: getTopPerformingCourses(),
      demographicData: getDemographicData(),
    },
    timeRange,
    setTimeRange,
    refreshData,
  };
};

export default useAdminAnalytics;
