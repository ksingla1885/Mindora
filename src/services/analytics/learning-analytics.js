import { prisma } from '@/lib/prisma';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  subDays, 
  differenceInDays,
  isWithinInterval,
  eachDayOfInterval,
  format
} from 'date-fns';

/**
 * Get user's learning analytics
 * @param {string} userId - User ID
 * @param {Object} options - Options for analytics
 * @param {number} [options.days=30] - Number of days to include in the analysis
 * @returns {Promise<Object>} Analytics data
 */
export const getUserLearningAnalytics = async (userId, { days = 30 } = {}) => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  // Get all attempts in the date range
  const attempts = await prisma.attempt.findMany({
    where: {
      userId,
      submittedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      question: {
        include: {
          topic: true,
          subject: true
        }
      }
    },
    orderBy: {
      submittedAt: 'asc'
    }
  });

  // Calculate daily activity
  const dailyActivity = calculateDailyActivity(attempts, startDate, endDate);
  
  // Calculate subject performance
  const subjectPerformance = calculateSubjectPerformance(attempts);
  
  // Calculate topic performance
  const topicPerformance = calculateTopicPerformance(attempts);
  
  // Calculate time-based metrics
  const timeMetrics = calculateTimeMetrics(attempts);
  
  // Calculate streaks
  const { currentStreak, longestStreak } = await calculateStreaks(userId, endDate);
  
  // Calculate accuracy trends
  const accuracyTrends = calculateAccuracyTrends(attempts, 7); // Weekly trends
  
  return {
    summary: {
      totalAttempts: attempts.length,
      correctAttempts: attempts.filter(a => a.isCorrect).length,
      accuracy: attempts.length > 0 
        ? (attempts.filter(a => a.isCorrect).length / attempts.length) * 100 
        : 0,
      currentStreak,
      longestStreak,
      averageTimePerQuestion: timeMetrics.averageTimeSpent,
      preferredStudyTime: timeMetrics.preferredStudyTime,
      mostActiveDay: timeMetrics.mostActiveDay
    },
    dailyActivity,
    subjectPerformance,
    topicPerformance: topicPerformance.slice(0, 10), // Top 10 topics
    accuracyTrends,
    timeDistribution: timeMetrics.timeDistribution,
    difficultyDistribution: calculateDifficultyDistribution(attempts),
    questionTypeDistribution: calculateQuestionTypeDistribution(attempts)
  };
};

/**
 * Calculate daily activity metrics
 * @private
 */
const calculateDailyActivity = (attempts, startDate, endDate) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const dayAttempts = attempts.filter(attempt => 
      isWithinInterval(new Date(attempt.submittedAt), { start: dayStart, end: dayEnd })
    );
    
    const correct = dayAttempts.filter(a => a.isCorrect).length;
    const total = dayAttempts.length;
    
    return {
      date: format(day, 'yyyy-MM-dd'),
      total,
      correct,
      accuracy: total > 0 ? (correct / total) * 100 : 0
    };
  });
};

/**
 * Calculate performance by subject
 * @private
 */
const calculateSubjectPerformance = (attempts) => {
  const subjectMap = new Map();
  
  attempts.forEach(attempt => {
    const subjectId = attempt.question?.subjectId;
    if (!subjectId) return;
    
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subjectId,
        subjectName: attempt.question?.subject?.name || 'Unknown',
        total: 0,
        correct: 0,
        timeSpent: 0
      });
    }
    
    const subject = subjectMap.get(subjectId);
    subject.total++;
    if (attempt.isCorrect) subject.correct++;
    subject.timeSpent += attempt.timeSpent || 0;
  });
  
  return Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    accuracy: subject.total > 0 ? (subject.correct / subject.total) * 100 : 0,
    averageTime: subject.total > 0 ? subject.timeSpent / subject.total : 0
  }));
};

/**
 * Calculate performance by topic
 * @private
 */
const calculateTopicPerformance = (attempts) => {
  const topicMap = new Map();
  
  attempts.forEach(attempt => {
    const topicId = attempt.question?.topicId;
    if (!topicId) return;
    
    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        topicId,
        topicName: attempt.question?.topic?.name || 'Unknown',
        subjectId: attempt.question?.subjectId,
        subjectName: attempt.question?.subject?.name || 'Unknown',
        total: 0,
        correct: 0,
        timeSpent: 0,
        lastAttempted: null
      });
    }
    
    const topic = topicMap.get(topicId);
    topic.total++;
    if (attempt.isCorrect) topic.correct++;
    topic.timeSpent += attempt.timeSpent || 0;
    
    const attemptDate = new Date(attempt.submittedAt);
    if (!topic.lastAttempted || attemptDate > new Date(topic.lastAttempted)) {
      topic.lastAttempted = attemptDate;
    }
  });
  
  return Array.from(topicMap.values())
    .map(topic => ({
      ...topic,
      accuracy: topic.total > 0 ? (topic.correct / topic.total) * 100 : 0,
      averageTime: topic.total > 0 ? topic.timeSpent / topic.total : 0
    }))
    .sort((a, b) => {
      // Sort by accuracy, then by recency
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return new Date(b.lastAttempted) - new Date(a.lastAttempted);
    });
};

/**
 * Calculate time-based metrics
 * @private
 */
const calculateTimeMetrics = (attempts) => {
  if (attempts.length === 0) {
    return {
      averageTimeSpent: 0,
      preferredStudyTime: null,
      mostActiveDay: null,
      timeDistribution: []
    };
  }
  
  // Calculate average time spent per question
  const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const averageTimeSpent = Math.round(totalTime / attempts.length);
  
  // Calculate preferred study time (morning/afternoon/evening/night)
  const timeSlots = {
    '00:00-05:59': 0, // Night
    '06:00-11:59': 0, // Morning
    '12:00-17:59': 0, // Afternoon
    '18:00-23:59': 0  // Evening
  };
  
  // Calculate most active day of the week
  const daysOfWeek = Array(7).fill(0);
  
  attempts.forEach(attempt => {
    if (!attempt.submittedAt) return;
    
    const date = new Date(attempt.submittedAt);
    const hours = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Categorize by time of day
    if (hours >= 0 && hours < 6) timeSlots['00:00-05:59']++;
    else if (hours < 12) timeSlots['06:00-11:59']++;
    else if (hours < 18) timeSlots['12:00-17:59']++;
    else timeSlots['18:00-23:59']++;
    
    // Count by day of week
    daysOfWeek[day]++;
  });
  
  // Find most active time slot
  const preferredStudyTime = Object.entries(timeSlots)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Find most active day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mostActiveDayIndex = daysOfWeek.indexOf(Math.max(...daysOfWeek));
  const mostActiveDay = dayNames[mostActiveDayIndex];
  
  // Format time distribution
  const timeDistribution = Object.entries(timeSlots).map(([time, count]) => ({
    time,
    count,
    percentage: Math.round((count / attempts.length) * 100)
  }));
  
  return {
    averageTimeSpent,
    preferredStudyTime,
    mostActiveDay,
    timeDistribution
  };
};

/**
 * Calculate user's streaks
 * @private
 */
const calculateStreaks = async (userId, endDate) => {
  // Get all days with activity
  const activityDays = await prisma.$queryRaw`
    SELECT DISTINCT DATE("submittedAt") as date
    FROM "Attempt"
    WHERE "userId" = ${userId} AND "submittedAt" IS NOT NULL
    ORDER BY date DESC
  `;
  
  if (activityDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  // Convert to Date objects and sort chronologically
  const dates = activityDays
    .map(d => new Date(d.date))
    .sort((a, b) => a - b);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Check if today or yesterday was active for current streak
  const today = new Date(endDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const lastActive = dates[dates.length - 1].toISOString().split('T')[0];
  
  if (lastActive === todayStr || lastActive === yesterdayStr) {
    currentStreak = 1;
    
    // Calculate current streak
    for (let i = dates.length - 2; i >= 0; i--) {
      const prevDate = new Date(dates[i + 1]);
      const currDate = new Date(dates[i]);
      
      const diffTime = Math.abs(prevDate - currDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }
  }
  
  // Calculate longest streak
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    
    const diffTime = Math.abs(currDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive days
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (diffDays > 1) {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  // Check one last time in case the longest streak is at the end
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { currentStreak, longestStreak };
};

/**
 * Calculate accuracy trends over time
 * @private
 */
const calculateAccuracyTrends = (attempts, windowSize = 7) => {
  if (attempts.length === 0) return [];
  
  // Group attempts by day
  const attemptsByDay = {};
  
  attempts.forEach(attempt => {
    if (!attempt.submittedAt) return;
    
    const dateStr = new Date(attempt.submittedAt).toISOString().split('T')[0];
    
    if (!attemptsByDay[dateStr]) {
      attemptsByDay[dateStr] = {
        date: dateStr,
        total: 0,
        correct: 0
      };
    }
    
    attemptsByDay[dateStr].total++;
    if (attempt.isCorrect) attemptsByDay[dateStr].correct++;
  });
  
  // Convert to array and sort by date
  const dailyStats = Object.values(attemptsByDay)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate moving average of accuracy
  const trends = [];
  
  for (let i = 0; i < dailyStats.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const windowStats = dailyStats.slice(start, i + 1);
    
    const total = windowStats.reduce((sum, day) => sum + day.total, 0);
    const correct = windowStats.reduce((sum, day) => sum + day.correct, 0);
    
    trends.push({
      date: dailyStats[i].date,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      total,
      windowSize: windowStats.length
    });
  }
  
  return trends;
};

/**
 * Calculate distribution of question difficulties
 * @private
 */
const calculateDifficultyDistribution = (attempts) => {
  const difficultyMap = new Map([
    ['EASY', { label: 'Easy', count: 0, correct: 0 }],
    ['MEDIUM', { label: 'Medium', count: 0, correct: 0 }],
    ['HARD', { label: 'Hard', count: 0, correct: 0 }]
  ]);
  
  attempts.forEach(attempt => {
    const difficulty = attempt.question?.difficulty || 'MEDIUM';
    if (difficultyMap.has(difficulty)) {
      difficultyMap.get(difficulty).count++;
      if (attempt.isCorrect) difficultyMap.get(difficulty).correct++;
    }
  });
  
  return Array.from(difficultyMap.entries()).map(([key, value]) => ({
    difficulty: key,
    label: value.label,
    count: value.count,
    correct: value.correct,
    accuracy: value.count > 0 ? (value.correct / value.count) * 100 : 0
  }));
};

/**
 * Calculate distribution of question types
 * @private
 */
const calculateQuestionTypeDistribution = (attempts) => {
  const typeMap = new Map();
  
  attempts.forEach(attempt => {
    const type = attempt.question?.type || 'UNKNOWN';
    
    if (!typeMap.has(type)) {
      typeMap.set(type, {
        type,
        count: 0,
        correct: 0,
        totalTime: 0
      });
    }
    
    const typeData = typeMap.get(type);
    typeData.count++;
    if (attempt.isCorrect) typeData.correct++;
    typeData.totalTime += attempt.timeSpent || 0;
  });
  
  return Array.from(typeMap.values()).map(typeData => ({
    ...typeData,
    accuracy: typeData.count > 0 ? (typeData.correct / typeData.count) * 100 : 0,
    averageTime: typeData.count > 0 ? typeData.totalTime / typeData.count : 0
  }));
};
