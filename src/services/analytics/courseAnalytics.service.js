import prisma from '@/lib/prisma';

class CourseAnalyticsService {
  /**
   * Get detailed analytics for a specific course
   * @param {string} courseId - The ID of the course
   * @param {Object} options - Additional options
   * @param {string} options.timeRange - Time range for the analytics (7d, 30d, 90d, 12m)
   * @returns {Promise<Object>} Course analytics data
   */
  static async getCourseAnalytics(courseId, { timeRange = '30d' } = {}) {
    try {
      const response = await fetch(
        `/api/admin/analytics/courses?courseId=${courseId}&timeRange=${timeRange}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch course analytics');
      }
      
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getCourseAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for multiple courses
   * @param {Array<string>} courseIds - Array of course IDs
   * @param {Object} options - Additional options
   * @param {string} options.timeRange - Time range for the analytics
   * @returns {Promise<Array>} Performance metrics for each course
   */
  static async getCoursesPerformance(courseIds, { timeRange = '30d' } = {}) {
    try {
      const response = await fetch(
        `/api/admin/analytics/courses/performance?ids=${courseIds.join(',')}&timeRange=${timeRange}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses performance');
      }
      
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getCoursesPerformance:', error);
      throw error;
    }
  }

  /**
   * Get enrollment trends for a course
   * @param {string} courseId - The ID of the course
   * @param {Object} options - Additional options
   * @param {string} options.timeRange - Time range for the analytics
   * @returns {Promise<Array>} Enrollment data points
   */
  static async getEnrollmentTrends(courseId, { timeRange = '30d' } = {}) {
    try {
      const response = await fetch(
        `/api/admin/analytics/courses/${courseId}/enrollments?timeRange=${timeRange}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollment trends');
      }
      
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getEnrollmentTrends:', error);
      throw error;
    }
  }

  /**
   * Get assessment performance for a course
   * @param {string} courseId - The ID of the course
   * @returns {Promise<Object>} Assessment performance data
   */
  static async getAssessmentPerformance(courseId) {
    try {
      const response = await fetch(
        `/api/admin/analytics/courses/${courseId}/assessments`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessment performance');
      }
      
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getAssessmentPerformance:', error);
      throw error;
    }
  }

  /**
   * Get revenue metrics for a course
   * @param {string} courseId - The ID of the course
   * @param {Object} options - Additional options
   * @param {string} options.timeRange - Time range for the analytics
   * @returns {Promise<Object>} Revenue metrics
   */
  static async getRevenueMetrics(courseId, { timeRange = '30d' } = {}) {
    try {
      const response = await fetch(
        `/api/admin/analytics/courses/${courseId}/revenue?timeRange=${timeRange}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue metrics');
      }
      
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getRevenueMetrics:', error);
      throw error;
    }
  }
}

export default CourseAnalyticsService;
