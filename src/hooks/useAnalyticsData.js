import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  testAnalyticsApi, 
  financialAnalyticsApi, 
  subscriptionAnalyticsApi,
  analyticsApi
} from '@/services/api/analytics.service';

// Default date ranges
export const DATE_RANGES = {
  '7d': {
    label: 'Last 7 days',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfDay(new Date()),
    })
  },
  '30d': {
    label: 'Last 30 days',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfDay(new Date()),
    })
  },
  '90d': {
    label: 'Last 90 days',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 89)),
      end: endOfDay(new Date()),
    })
  },
  '12m': {
    label: 'Last 12 months',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 364)),
      end: endOfDay(new Date()),
    })
  },
  custom: {
    label: 'Custom Range',
    getRange: (start, end) => ({
      start: startOfDay(new Date(start)),
      end: endOfDay(new Date(end)),
    })
  }
};

const useAnalyticsData = (initialRange = '30d', customRange = null) => {
  const [dateRange, setDateRange] = useState(initialRange);
  const [dateRangeValue, setDateRangeValue] = useState({
    start: null,
    end: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    testAnalytics: null,
    financialAnalytics: null,
    subscriptionAnalytics: null,
  });

  // Update date range
  const updateDateRange = useCallback((range, customStart = null, customEnd = null) => {
    setDateRange(range);
    
    if (range === 'custom' && customStart && customEnd) {
      const { start, end } = DATE_RANGES.custom.getRange(customStart, customEnd);
      setDateRangeValue({ start, end });
    } else if (DATE_RANGES[range]) {
      setDateRangeValue(DATE_RANGES[range].getRange());
    }
  }, []);

  // Format date for API
  const formatDateForApi = (date) => format(date, 'yyyy-MM-dd');

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    if (!dateRangeValue.start || !dateRangeValue.end) return;

    setIsLoading(true);
    setError(null);

    try {
      const [testData, financialData, subscriptionData] = await Promise.all([
        testAnalyticsApi.getTestAnalytics(
          'all',
          formatDateForApi(dateRangeValue.start),
          formatDateForApi(dateRangeValue.end)
        ),
        financialAnalyticsApi.getFinancialOverview(
          dateRangeValue.start,
          dateRangeValue.end,
          dateRange === '12m' ? 'month' : 'day'
        ),
        subscriptionAnalyticsApi.getSubscriptionMetrics(
          dateRangeValue.start,
          dateRangeValue.end
        ),
      ]);

      setData({
        testAnalytics: testData,
        financialAnalytics: financialData,
        subscriptionAnalytics: subscriptionData,
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, dateRangeValue]);

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange === 'custom' && (!dateRangeValue.start || !dateRangeValue.end)) {
      return;
    }
    
    fetchAnalyticsData();
  }, [dateRange, dateRangeValue, fetchAnalyticsData]);

  // Format time series data for charts
  const formatTimeSeriesData = useCallback((data, dateKey, valueKeys) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
      const formattedItem = { ...item };
      
      // Format date
      if (dateKey && item[dateKey]) {
        formattedItem.date = format(new Date(item[dateKey]), 'yyyy-MM-dd');
      }
      
      // Format values
      valueKeys?.forEach(key => {
        if (item[key] !== undefined) {
          formattedItem[key] = Number(item[key]) || 0;
        }
      });
      
      return formattedItem;
    });
  }, []);

  // Get chart options based on date range
  const getChartOptions = useCallback(() => {
    switch (dateRange) {
      case '7d':
        return {
          xAxisFormat: (value) => format(new Date(value), 'EEE'),
          tooltipDateFormat: 'EEEE, MMM d, yyyy',
        };
      case '30d':
      case '90d':
        return {
          xAxisFormat: (value) => format(new Date(value), 'MMM d'),
          tooltipDateFormat: 'MMM d, yyyy',
        };
      case '12m':
        return {
          xAxisFormat: (value) => format(new Date(value), 'MMM yyyy'),
          tooltipDateFormat: 'MMMM yyyy',
        };
      case 'custom':
      default:
        const diffDays = Math.ceil((dateRangeValue.end - dateRangeValue.start) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) {
          return {
            xAxisFormat: (value) => format(new Date(value), 'EEE'),
            tooltipDateFormat: 'EEEE, MMM d, yyyy',
          };
        } else if (diffDays <= 90) {
          return {
            xAxisFormat: (value) => format(new Date(value), 'MMM d'),
            tooltipDateFormat: 'MMM d, yyyy',
          };
        } else {
          return {
            xAxisFormat: (value) => format(new Date(value), 'MMM yyyy'),
            tooltipDateFormat: 'MMMM yyyy',
          };
        }
    }
  }, [dateRange, dateRangeValue]);

  // Export data
  const exportData = useCallback(async (type, format = 'csv') => {
    try {
      await analyticsApi.exportData(
        type,
        format,
        dateRangeValue.start,
        dateRangeValue.end
      );
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, [dateRangeValue]);

  return {
    // State
    isLoading,
    error,
    data,
    dateRange,
    dateRangeValue,
    
    // Methods
    updateDateRange,
    formatTimeSeriesData,
    getChartOptions,
    exportData,
    
    // Formatters
    formatCurrency: (value) => 
      new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value),
      
    formatPercentage: (value, decimals = 1) => 
      `${Number(value).toFixed(decimals)}%`,
      
    formatNumber: (value) => 
      new Intl.NumberFormat().format(value),
  };
};

export default useAnalyticsData;
