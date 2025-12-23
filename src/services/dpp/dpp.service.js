import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/services/notification/notification.service';
import { USER_ROLE } from '@/config/constants';
import { 
  startOfToday, 
  endOfToday, 
  addDays, 
  isSameDay, 
  differenceInDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isWithinInterval
} from 'date-fns';
import { calculateMastery } from '@/lib/learning/adaptive';
import { calculateNextOptimalReview } from '@/lib/learning/spaced-repetition';

// Cache for question bank to improve performance
let questionBankCache = {
  lastUpdated: null,
  questions: null,
  expiry: null
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MASTERY_THRESHOLD = 0.8; // 80% correct to master a topic
const CONFIDENCE_DECAY_RATE = 0.05; // 5% decay per day for confidence

// Enhanced analytics models
const calculatePerformanceMetrics = (attempts) => {
  if (!attempts || attempts.length === 0) return {};
  
  const total = attempts.length;
  const correct = attempts.filter(a => a.isCorrect).length;
  const accuracy = total > 0 ? correct / total : 0;
  const avgTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / total;
  
  // Calculate confidence score (weighted by recency)
  const now = new Date();
  const confidenceScores = attempts.map(a => {
    const daysAgo = differenceInDays(now, new Date(a.submittedAt || now));
    const recencyWeight = Math.exp(-CONFIDENCE_DECAY_RATE * daysAgo);
    return a.isCorrect ? recencyWeight : -recencyWeight;
  });
  
  const confidence = confidenceScores.reduce((sum, score) => sum + score, 0) / attempts.length;
  
  return {
    totalAttempts: total,
    correctAttempts: correct,
    accuracy,
    averageTime: avgTime,
    confidence: Math.max(0, Math.min(1, (confidence + 1) / 2)) // Normalize to 0-1
  };
};

// Adaptive difficulty calculator
const calculateNextDifficulty = (currentDifficulty, performance, attempts = []) => {
  const { accuracy, confidence } = performance;
  
  // If we have recent attempts, use them to adjust difficulty
  if (attempts.length > 0) {
    const recentAccuracy = attempts
      .slice(-5)
      .reduce((sum, a) => sum + (a.isCorrect ? 1 : 0), 0) / Math.min(5, attempts.length);
    
    if (recentAccuracy > 0.8) {
      return Math.min(1, currentDifficulty + 0.1);
    } else if (recentAccuracy < 0.4) {
      return Math.max(0, currentDifficulty - 0.15);
    }
    return currentDifficulty;
  }
  
  // Fallback to accuracy-based adjustment
  if (accuracy > 0.8) return Math.min(1, currentDifficulty + 0.1);
  if (accuracy < 0.4) return Math.max(0, currentDifficulty - 0.15);
  return currentDifficulty;
};

// Gamification elements
const GAMIFICATION_POINTS = {
  CORRECT_ANSWER: 10,
  STREAK_BONUS: 5,
  DAILY_CHALLENGE: 20,
  TOPIC_MASTERY: 50,
  PERFECT_WEEK: 100
};

class DPPError extends Error {
  constructor(message, code = 'DPP_ERROR') {
    super(message);
    this.name = 'DPPError';
    this.code = code;
  }
}

/**
 * Get or create DPP configuration for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} DPP configuration
 */
export /**
 * Get or create DPP configuration for a user with enhanced defaults
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} DPP configuration
 */
const getOrCreateDPPConfig = async (userId) => {
  try {
    // Check if user exists and get their class/subject preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        class: true,
        subjects: true 
      },
    });

    if (!user) {
      throw new DPPError('User not found', 'USER_NOT_FOUND');
    }

    // Get or create config
    let config = await prisma.dPPConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      // Default configuration based on user's class
      const defaultConfig = {
        userId,
        subjects: user.subjects?.length > 0 
          ? user.subjects 
          : (user.class ? await getDefaultSubjectsForClass(user.class) : []),
        difficulty: ['easy', 'medium'],
        dailyLimit: 5,
        timeOfDay: '09:00',
        notifications: true,
        questionTypes: ['MCQ', 'NUMERICAL'],
        topics: [],
        updatedAt: new Date(),
      };

      config = await prisma.dPPConfig.create({
        data: defaultConfig,
      });

      // If user has no subjects, set up default subjects based on class
      if (defaultConfig.subjects.length === 0 && user.class) {
        const defaultSubjects = await getDefaultSubjectsForClass(user.class);
        if (defaultSubjects.length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { 
              subjects: { set: defaultSubjects },
              dppConfig: {
                update: {
                  subjects: { set: defaultSubjects }
                }
              }
            },
          });
          config.subjects = defaultSubjects;
        }
      }
    }

    return config;
  } catch (error) {
    console.error('Error getting DPP config:', error);
    if (error instanceof DPPError) throw error;
    throw new DPPError('Failed to get DPP configuration');
  }
};

/**
 * Get default subjects for a class
 * @private
 */
async function getDefaultSubjectsForClass(className) {
  // Map of class to default subjects
  const classSubjectMap = {
    '9': ['physics', 'chemistry', 'mathematics', 'biology'],
    '10': ['physics', 'chemistry', 'mathematics', 'biology'],
    '11': ['physics', 'chemistry', 'mathematics', 'biology'],
    '12': ['physics', 'chemistry', 'mathematics', 'biology'],
  };

  const defaultSubjects = classSubjectMap[className] || [];
  
  // Verify these subjects exist in the database
  const existingSubjects = await prisma.subject.findMany({
    where: {
      slug: { in: defaultSubjects }
    },
    select: { id: true }
  });

  return existingSubjects.map(s => s.id);
}

/**
 * Update DPP configuration for a user
 * @param {string} userId - The user ID
 * @param {Object} updates - Configuration updates
 * @returns {Promise<Object>} Updated DPP configuration
 */
export const updateDPPConfig = async (userId, updates) => {
  try {
    const config = await prisma.dPPConfig.update({
      where: { userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return config;
  } catch (error) {
    console.error('Error updating DPP config:', error);
    throw new DPPError('Failed to update DPP configuration');
  }
};

/**
 * Get today's DPP for a user with caching and auto-generation
 * @param {string} userId - The user ID
 * @param {boolean} includeCompleted - Whether to include completed questions
 * @returns {Promise<Array>} List of DPP assignments for today
 */
const getTodaysDPP = async (userId, includeCompleted = false) => {
  try {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Check for existing DPP for today
    let dpp = await prisma.dailyPracticeProblem.findFirst({
      where: {
        userId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        questions: {
          include: {
            question: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          },
          orderBy: { sequence: 'asc' },
          where: includeCompleted ? {} : { status: 'PENDING' }
        }
      }
    });

    // If no DPP exists for today, generate one
    if (!dpp) {
      dpp = await generateDPP(userId);
    }
    // If DPP exists but has no questions (shouldn't happen, but just in case)
    else if (!dpp.questions || dpp.questions.length === 0) {
      await prisma.dailyPracticeProblem.delete({ where: { id: dpp.id } });
      dpp = await generateDPP(userId);
    }

    // Format the response
    return dpp.questions.map(q => ({
      id: q.id,
      question: q.question,
      status: q.status,
      userAnswer: q.userAnswer,
      isCorrect: q.isCorrect,
      timeSpent: q.timeSpent,
      completedAt: q.completedAt,
      sequence: q.sequence
    }));
  } catch (error) {
    console.error('Error getting today\'s DPP:', error);
    throw new DPPError('Failed to fetch today\'s DPP');
  }
};

/**
 * Generate new DPP assignments for a user
 * @param {string} userId - The user ID
 * @param {number} [count] - Number of questions to assign (defaults to user's daily limit)
 * @returns {Promise<Array>} New DPP assignments
 */
export /**
 * Generate new DPP assignments for a user
 * @param {string} userId - The user ID
 * @param {number} [count] - Number of questions to assign (defaults to user's daily limit)
 * @returns {Promise<Array>} New DPP assignments
 */
const generateDPP = async (userId, count) => {
  try {
    // Get user's DPP configuration
    const config = await getOrCreateDPPConfig(userId);
    const questionCount = count || config.dailyLimit;

    // Check if we have a recent cache of questions
    const now = new Date();
    if (!questionBankCache.questions || !questionBankCache.expiry || now > questionBankCache.expiry) {
      // Fetch questions based on user's configuration
      const questions = await prisma.question.findMany({
        where: {
          subjectId: { in: config.subjects },
          difficulty: { in: config.difficulty },
          type: { in: config.questionTypes },
          topicId: config.topics?.length > 0 ? { in: config.topics } : undefined,
          isActive: true,
        },
        include: {
          topic: {
            include: {
              subject: true,
            },
          },
        },
        take: 100, // Fetch more than needed to have variety
      });

      // Update cache
      questionBankCache = {
        questions,
        lastUpdated: now,
        expiry: new Date(now.getTime() + CACHE_TTL),
      };
    }

    // Get user's previously attempted questions to avoid repetition
    const attemptedQuestions = await prisma.dPPAssignment.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const attemptedQuestionIds = attemptedQuestions.map(q => q.questionId);

    // Filter out attempted questions and select random ones
    const availableQuestions = questionBankCache.questions.filter(
      q => !attemptedQuestionIds.includes(q.id)
    );

    // If not enough questions, allow some repetition
    const questionsToAssign = availableQuestions.length >= questionCount
      ? availableQuestions
      : [...availableQuestions, ...questionBankCache.questions];

    // Shuffle and select questions
    const selectedQuestions = questionsToAssign
      .sort(() => 0.5 - Math.random())
      .slice(0, questionCount);

    // Create a new DPP for today
    const todayDPP = await prisma.dailyPracticeProblem.create({
      data: {
        userId,
        date: startOfToday(),
        totalQuestions: selectedQuestions.length,
      },
    });

    // Create DPP assignments
    const assignments = await Promise.all(
      selectedQuestions.map((q, index) =>
        prisma.dPPAssignment.create({
          data: {
            dppId: todayDPP.id,
            questionId: q.id,
            userId,
            sequence: index + 1,
            status: 'PENDING',
          },
          include: {
            question: {
              include: {
                topic: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    // Send notification if enabled
    if (config.notifications) {
      await sendNotification({
        userId,
        title: 'Your Daily Practice Problems are ready!',
        message: `You have ${selectedQuestions.length} new questions to solve today.`,
        type: 'DPP_GENERATED',
        data: { dppId: todayDPP.id },
      });
    }

    return assignments.map(a => ({
      id: a.id,
      question: a.question,
      status: a.status,
      sequence: a.sequence,
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      submittedAt: a.submittedAt,
      timeSpent: a.timeSpent,
    }));
  } catch (error) {
    console.error('Error generating DPP:', error);
    throw new DPPError('Failed to generate Daily Practice Problems');
  }
  try {
    const config = await getOrCreateDPPConfig(userId);
    const limit = count || config.dailyLimit;

    // Get user's progress to avoid repeating questions
    const userProgress = await prisma.dPPProgress.findUnique({
      where: { userId },
    });

    // Get user's completed question IDs
    const completedQuestions = await prisma.dPPAssignment.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      select: { questionId: true },
    });
    const completedQuestionIds = completedQuestions.map((q) => q.questionId);

    // Find questions that match user's preferences and haven't been completed
    const questions = await prisma.question.findMany({
      where: {
        id: { notIn: completedQuestionIds },
        topic: {
          subjectId: { in: config.subjects },
        },
        difficulty: { in: config.difficulty },
        isActive: true,
      },
      take: limit,
      orderBy: {
        // Prioritize questions that haven't been seen much
        attempts: 'asc',
      },
    });

    if (questions.length === 0) {
      throw new DPPError('No new questions available', 'NO_QUESTIONS_AVAILABLE');
    }

    // Create DPP assignments
    const assignments = await Promise.all(
      questions.map((question) =>
        prisma.dPPAssignment.create({
          data: {
            userId,
            questionId: question.id,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
          },
          include: {
            question: {
              include: {
                topic: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    // Update user's progress
    await prisma.dPPProgress.upsert({
      where: { userId },
      update: {
        totalAssigned: { increment: assignments.length },
        lastActiveDate: new Date(),
      },
      create: {
        userId,
        date: new Date(),
        totalAssigned: assignments.length,
        lastActiveDate: new Date(),
      },
    });

    // Send notification if enabled
    if (config.notifications) {
      await sendNotification({
        userId,
        title: 'New Daily Practice Problems',
        message: `You have ${assignments.length} new practice questions waiting for you!`,
        type: 'DPP_ASSIGNED',
        data: {
          assignmentIds: assignments.map((a) => a.id),
        },
      });
    }

    return assignments;
  } catch (error) {
    console.error('Error generating DPP:', error);
    throw new DPPError(
      error.message || 'Failed to generate DPP',
      error.code || 'DPP_GENERATION_FAILED'
    );
  }
};

/**
 * Submit an answer for a DPP question
 * @param {string} assignmentId - The DPP assignment ID
 * @param {string} userId - The user ID
 * @param {string} answer - The user's answer
 * @param {Object} metadata - Additional metadata (time spent, etc.)
 * @returns {Promise<Object>} The updated assignment with result
 */
export /**
 * Submit an answer for a DPP question
 * @param {string} assignmentId - The DPP assignment ID
 * @param {string} userId - The user ID
 * @param {string} answer - The user's answer
 * @param {Object} metadata - Additional metadata (time spent, etc.)
 * @returns {Promise<Object>} The updated assignment with result
 */
const submitDPPAnswer = async (assignmentId, userId, answer, metadata = {}) => {
  try {
    // Get the assignment with the question
    const assignment = await prisma.dPPAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        question: true,
        dpp: true,
      },
    });

    if (!assignment) {
      throw new DPPError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    }

    if (assignment.userId !== userId) {
      throw new DPPError('Unauthorized', 'UNAUTHORIZED');
    }

    if (assignment.status === 'COMPLETED') {
      throw new DPPError('Question already answered', 'ALREADY_ANSWERED');
    }

    // Check if the answer is correct
    const isCorrect = checkAnswer(assignment.question, answer);
    const timeSpent = metadata.timeSpent || 0;

    // Update the assignment
    const updatedAssignment = await prisma.dPPAssignment.update({
      where: { id: assignmentId },
      data: {
        userAnswer: answer,
        isCorrect,
        submittedAt: new Date(),
        status: 'COMPLETED',
        timeSpent,
        metadata: metadata,
      },
      include: {
        question: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    // Update user's DPP progress
    await updateUserDPPProgress(userId, isCorrect);

    // Update streak if needed
    await calculateAndUpdateStreak(userId);

    // Check if all questions in this DPP are completed
    const remainingAssignments = await prisma.dPPAssignment.count({
      where: {
        dppId: assignment.dppId,
        status: 'PENDING',
      },
    });

    // If all questions are completed, update the DPP status
    if (remainingAssignments === 0) {
      await prisma.dailyPracticeProblem.update({
        where: { id: assignment.dppId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Send completion notification
      const config = await getOrCreateDPPConfig(userId);
      if (config.notifications) {
        await sendNotification({
          userId,
          title: 'Daily Practice Completed!',
          message: 'You have completed all questions for today. Great job!',
          type: 'DPP_COMPLETED',
          data: { dppId: assignment.dppId },
        });
      }
    }

    return {
      ...updatedAssignment,
      correctAnswer: isCorrect ? undefined : assignment.question.correctAnswer,
      explanation: isCorrect ? undefined : assignment.question.explanation,
    };
  } catch (error) {
    console.error('Error submitting DPP answer:', error);
    if (error instanceof DPPError) throw error;
    throw new DPPError('Failed to submit answer. Please try again.');
  }
};

/**
 * Calculate performance trends from weekly data
 * @private
 */
const calculatePerformanceTrends = (weeklyData) => {
  if (!weeklyData || weeklyData.length === 0) {
    return {
      accuracyTrend: [],
      activityTrend: [],
      difficultyTrend: []
    };
  }

  // Calculate accuracy trend (last 4 weeks)
  const accuracyTrend = weeklyData
    .slice(-4)
    .map(week => ({
      week: week.weekNumber,
      accuracy: week.totalAttempts > 0 
        ? (week.correctAttempts / week.totalAttempts) * 100 
        : 0
    }));

  // Calculate activity trend (questions per day)
  const activityTrend = weeklyData
    .slice(-4)
    .map(week => ({
      week: week.weekNumber,
      questions: week.totalAttempts,
      daysActive: week.daysActive || 0
    }));

  return { accuracyTrend, activityTrend };
};

/**
 * Generate predictions based on user performance
 * @private
 */
const generatePredictions = async (userId, { accuracyTrend, activityTrend, currentStreak }) => {
  const predictions = {
    nextWeekAccuracy: null,
    streakPrediction: null,
    studyRecommendation: null
  };

  // Simple linear regression for accuracy prediction (last 2 data points)
  if (accuracyTrend.length >= 2) {
    const last = accuracyTrend[accuracyTrend.length - 1];
    const prev = accuracyTrend[accuracyTrend.length - 2];
    const slope = (last.accuracy - prev.accuracy) / (last.week - prev.week);
    predictions.nextWeekAccuracy = Math.max(0, Math.min(100, 
      last.accuracy + slope * (last.week + 1 - last.week)
    ));
  }

  // Streak prediction based on current streak and activity
  if (currentStreak > 0) {
    const avgQuestionsPerDay = activityTrend.reduce((sum, week) => 
      sum + (week.questions / 7), 0) / activityTrend.length;
    
    if (avgQuestionsPerDay >= 5) {
      predictions.streakPrediction = currentStreak + 7; // Full week if consistent
    } else if (avgQuestionsPerDay >= 3) {
      predictions.streakPrediction = currentStreak + 3; // Few more days
    } else {
      predictions.streakPrediction = currentStreak + 1; // Just tomorrow
    }
  }

  // Generate study recommendation
  const latestAccuracy = accuracyTrend.length > 0 
    ? accuracyTrend[accuracyTrend.length - 1].accuracy 
    : 0;
  
  if (latestAccuracy < 50) {
    predictions.studyRecommendation = {
      action: 'review',
      focus: 'weak_topics',
      time: '30_minutes',
      priority: 'high'
    };
  } else if (latestAccuracy < 75) {
    predictions.studyRecommendation = {
      action: 'practice',
      focus: 'mixed_difficulty',
      time: '20_minutes',
      priority: 'medium'
    };
  } else {
    predictions.studyRecommendation = {
      action: 'challenge',
      focus: 'hard_questions',
      time: '15_minutes',
      priority: 'low'
    };
  }

  return predictions;
};
    
/**
 * Generate study recommendations based on user performance
 * @private
 */
const generateRecommendations = async (userId, { subjectBreakdown, topics, dailyAverage, accuracy }) => {
  const recommendations = [];
  
  // Add subject-specific recommendations
  subjectBreakdown.forEach(subject => {
    if (subject.accuracy < 60) {
      recommendations.push({
        type: 'subject_review',
        priority: 'high',
        subject: subject.name,
        subjectId: subject.id,
        message: `Your accuracy in ${subject.name} is low (${subject.accuracy.toFixed(1)}%). Consider reviewing the basics.`,
        action: {
          type: 'practice',
          subjectId: subject.id,
          difficulty: 'easy',
          count: 5
        }
      });
    }
  });

  // Add topic-specific recommendations
  const weakTopics = topics
    .filter(topic => topic.accuracy < 65)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  weakTopics.forEach(topic => {
    recommendations.push({
      type: 'topic_focus',
      priority: 'medium',
      topic: topic.name,
      topicId: topic.id,
      subject: topic.subjectName,
      subjectId: topic.subjectId,
      message: `Focus on ${topic.name} (${topic.accuracy.toFixed(1)}% accuracy)`,
      action: {
        type: 'practice',
        topicId: topic.id,
        count: 3,
        difficulty: 'medium'
      }
    });
  });

  // Add time management recommendations
  if (dailyAverage < 2) {
    recommendations.push({
      type: 'time_management',
      priority: 'low',
      message: 'Try to solve at least 2 questions daily to maintain consistency.',
      action: {
        type: 'set_reminder',
        time: '18:00',
        message: 'Time for your daily practice!'
      }
    });
  }

  // Add accuracy-based recommendations
  if (accuracy < 50) {
    recommendations.push({
      type: 'accuracy_improvement',
      priority: 'high',
      message: 'Your overall accuracy is low. Focus on understanding concepts before attempting more questions.',
      action: {
        type: 'study_plan',
        resources: ['concept_videos', 'formula_sheets'],
        time: '30_minutes'
      }
    });
  }

  return recommendations;
};

/**
 * Get weekly progress data for a user
 * @private
 */
const getWeeklyProgress = async (userId, weeks = 8) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));
  
  const weeklyData = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('week', a."submittedAt") AS week_start,
      COUNT(a.id) AS total_attempts,
      SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) AS correct_attempts,
      AVG(a."timeSpent") AS avg_time_spent,
      COUNT(DISTINCT DATE(a."submittedAt")) AS active_days
    FROM "Attempt" a
    WHERE a."userId" = ${userId}
      AND a."submittedAt" BETWEEN ${startDate} AND ${endDate}
    GROUP BY DATE_TRUNC('week', a."submittedAt")
    ORDER BY week_start
  `;
  
  return weeklyData.map((week, index) => ({
    weekNumber: weeks - index,
    startDate: week.week_start,
    totalAttempts: Number(week.total_attempts),
    correctAttempts: Number(week.correct_attempts),
    accuracy: week.total_attempts > 0 
      ? (week.correct_attempts / week.total_attempts) * 100 
      : 0,
    avgTimeSpent: Number(week.avg_time_spent) || 0,
    daysActive: Number(week.active_days) || 0
  }));
};

/**
 * Get daily activity data
 * @private
 */
const getDailyActivity = async (userId, days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const dailyData = await prisma.$queryRaw`
    SELECT 
      DATE(a."submittedAt") AS date,
      COUNT(a.id) AS total_attempts,
      SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) AS correct_attempts,
      SUM(a."timeSpent") AS total_time_spent
    FROM "Attempt" a
    WHERE a."userId" = ${userId}
      AND a."submittedAt" BETWEEN ${startDate} AND ${endDate}
    GROUP BY DATE(a."submittedAt")
    ORDER BY date
  `;
  
  // Fill in missing days with zeros
  const result = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayData = dailyData.find(d => d.date.toISOString().split('T')[0] === dateStr);
    
    result.push({
      date: dateStr,
      totalAttempts: dayData ? Number(dayData.total_attempts) : 0,
      correctAttempts: dayData ? Number(dayData.correct_attempts) : 0,
      totalTimeSpent: dayData ? Number(dayData.total_time_spent) : 0
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
};

/**
 * Get subject breakdown for a user
 * @private
 */
const getSubjectBreakdown = async (userId) => {
  const subjectData = await prisma.$queryRaw`
    SELECT 
      s.id,
      s.name,
      COUNT(a.id) AS total_attempts,
      SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) AS correct_attempts,
      AVG(a."timeSpent") AS avg_time_spent,
      COUNT(DISTINCT a."topicId") AS topics_covered
    FROM "Subject" s
    LEFT JOIN "Topic" t ON t."subjectId" = s.id
    LEFT JOIN "Question" q ON q."topicId" = t.id
    LEFT JOIN "Attempt" a ON a."questionId" = q.id AND a."userId" = ${userId}
    WHERE a.id IS NOT NULL
    GROUP BY s.id, s.name
    ORDER BY total_attempts DESC
  `;
  
  return subjectData.map(subject => ({
    id: subject.id,
    name: subject.name,
    totalAttempts: Number(subject.total_attempts) || 0,
    correctAttempts: Number(subject.correct_attempts) || 0,
    accuracy: subject.total_attempts > 0 
      ? (subject.correct_attempts / subject.total_attempts) * 100 
      : 0,
    avgTimeSpent: Number(subject.avg_time_spent) || 0,
    topicsCovered: Number(subject.topics_covered) || 0
  }));
};

/**
 * Get top topics for a user
 * @private
 */
const getTopTopics = async (userId, limit = 10) => {
  const topicData = await prisma.$queryRaw`
    SELECT 
      t.id,
      t.name,
      s.id AS "subjectId",
      s.name AS "subjectName",
      COUNT(a.id) AS total_attempts,
      SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) AS correct_attempts,
      AVG(a."timeSpent") AS avg_time_spent,
      MAX(a."submittedAt") AS last_attempted
    FROM "Topic" t
    JOIN "Subject" s ON s.id = t."subjectId"
    JOIN "Question" q ON q."topicId" = t.id
    JOIN "Attempt" a ON a."questionId" = q.id
    WHERE a."userId" = ${userId}
    GROUP BY t.id, t.name, s.id, s.name
    ORDER BY total_attempts DESC
    LIMIT ${limit}
  `;
  
  return topicData.map(topic => ({
    id: topic.id,
    name: topic.name,
    subjectId: topic.subjectId,
    subjectName: topic.subjectName,
    totalAttempts: Number(topic.total_attempts) || 0,
    correctAttempts: Number(topic.correct_attempts) || 0,
    accuracy: topic.total_attempts > 0 
      ? (topic.correct_attempts / topic.total_attempts) * 100 
      : 0,
    avgTimeSpent: Number(topic.avg_time_spent) || 0,
    lastAttempted: topic.last_attempted
  }));
};

/**
 * Get user badges
 * @private
 */
const getUserBadges = async (userId, limit = 5) => {
  return prisma.badge.findMany({
    where: { userId },
    orderBy: { awardedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      name: true,
      description: true,
      icon: true,
      awardedAt: true
    }
  });
};

/**
 * Get recent achievements
 * @private
 */
const getRecentAchievements = async (userId, limit = 3) => {
  return prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      points: true,
      unlockedAt: true
    }
  });
};

/**
 * Calculate user level based on points
 * @private
 */
const calculateLevel = (points) => {
  return Math.floor(Math.sqrt(points / 100)) + 1;
};

/**
 * Get points needed for next level
 * @private
 */
const getPointsForNextLevel = (currentPoints) => {
  const currentLevel = calculateLevel(currentPoints);
  return Math.pow(currentLevel, 2) * 100 - currentPoints;
};

// Export all DPP service functions
export {
  getOrCreateDPPConfig,
  updateDPPConfig,
  getTodaysDPP,
  generateDPP,
  submitDPPAnswer,
  skipDPPQuestion,
  getEnhancedDPPStats as getDPPStats,
  getDPPHistoryOld as getDPPHistory,
  generatePracticeTest,
  calculatePerformanceMetrics,
  calculateNextDifficulty,
  calculatePerformanceTrends,
  generatePredictions,
  generateRecommendations
};

/**
 * Get enhanced DPP statistics for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Options for the stats
 * @returns {Promise<Object>} Enhanced DPP statistics
 */
const getEnhancedDPPStats = async (userId, options = {}) => {
  try {
    const { includePredictions = true, includeRecommendations = true } = options;
    
    // Get user progress
    const progress = await prisma.userProgress.findUnique({
      where: { userId },
      include: {
        subjectProgress: {
          include: { topicProgress: true }
        }
      }
    });

    if (!progress) {
      return getDefaultStats();
    }

    // Calculate basic metrics
    const accuracy = progress.totalDPPAttempts > 0 
      ? progress.correctDPPAnswers / progress.totalDPPAttempts 
      : 0;
    
    const totalTimeSpentHours = progress.totalTimeSpent / 3600; // Convert to hours
    const avgTimePerQuestion = progress.totalDPPAttempts > 0 
      ? progress.totalTimeSpent / progress.totalDPPAttempts 
      : 0; // in seconds
    
    const accountCreatedAt = progress.createdAt || new Date();
    const accountAgeDays = Math.ceil((new Date() - accountCreatedAt) / (1000 * 60 * 60 * 24));
    const dailyAverage = accountAgeDays > 0 
      ? progress.totalDPPAttempts / accountAgeDays 
      : 0;

    // Get weekly progress data
    const weeklyData = await getWeeklyProgress(userId, 8); // Last 8 weeks
    
    // Get daily activity for the last 30 days
    const dailyData = await getDailyActivity(userId, 30);
    
    // Calculate subject breakdown
    const subjectBreakdown = await getSubjectBreakdown(userId);
    
    // Get top 10 topics by attempts
    const topics = await getTopTopics(userId, 10);
    
    // Calculate trends
    const trendData = calculatePerformanceTrends(weeklyData);
    
    // Generate predictions if requested
    let predictions = {};
    if (includePredictions) {
      predictions = await generatePredictions(userId, {
        accuracyTrend: trendData.accuracyTrend,
        activityTrend: trendData.activityTrend,
        currentStreak: progress.currentStreak
      });
    }
    
    // Generate recommendations if requested
    let recommendations = [];
    if (includeRecommendations) {
      recommendations = await generateRecommendations(userId, {
        subjectBreakdown,
        topics,
        dailyAverage,
        accuracy
      });
    }
    
    // Compile final stats object
    return {
      // Basic metrics
      totalAttempts: progress.totalDPPAttempts,
      correctAttempts: progress.correctDPPAnswers,
      accuracy: Math.round(accuracy * 100) / 100,
      currentStreak: progress.currentStreak,
      maxStreak: progress.maxStreak,
      totalTimeSpent: progress.totalTimeSpent,
      totalTimeSpentHours: Math.round(totalTimeSpentHours * 10) / 10,
      avgTimePerQuestion: Math.round(avgTimePerQuestion * 10) / 10,
      dailyAverage: Math.round(dailyAverage * 10) / 10,
      daysActive: totalDaysActive,
      
      // Time-based metrics
      lastActive: progress.lastActive,
      accountAgeDays: totalDaysActive,
      
      // Progress over time
      weeklyProgress: weeklyData,
      dailyActivity: dailyData,
      
      // Performance analysis
      subjectBreakdown,
      topicPerformance: topics,
      
      // Trends and predictions
      trends: trendData,
      predictions,
      
      // Recommendations
      recommendations,
      
      // Gamification
      points: progress.points || 0,
      level: this.calculateLevel(progress.points || 0),
      nextLevelPoints: this.getPointsForNextLevel(progress.points || 0),
      badges: await this.getUserBadges(userId, 5), // Get 5 most recent badges
      achievements: await this.getRecentAchievements(userId, 3) // Get 3 most recent achievements
    };
  } catch (error) {
    console.error('Error getting enhanced DPP stats:', error);
    throw new DPPError('Failed to get DPP statistics', 'STATS_FETCH_ERROR');
  }
};

// Helper to get default stats when no data exists
const getDefaultStats = () => ({
  totalAttempts: 0,
  correctAttempts: 0,
  accuracy: 0,
  currentStreak: 0,
  maxStreak: 0,
  totalTimeSpent: 0,
  totalTimeSpentHours: 0,
  avgTimePerQuestion: 0,
  dailyAverage: 0,
  daysActive: 0,
  lastActive: null,
  accountAgeDays: 0,
  weeklyProgress: [],
  dailyActivity: [],
  subjectBreakdown: [],
  topicPerformance: [],
  trends: {
    accuracyTrend: 'stable',
    activityTrend: 'stable',
    consistencyScore: 0,
    bestTimeOfDay: null,
    mostProductiveDay: null
  },
  predictions: {
    nextMilestone: null,
    estimatedMasteryDate: null,
    projectedAccuracy: null
  },
  recommendations: [
    {
      type: 'GET_STARTED',
      priority: 'high',
      message: 'Complete your first practice question to get started!',
      action: { type: 'START_PRACTICE', label: 'Start Practicing' }
    }
  ],
  points: 0,
  level: 1,
  nextLevelPoints: 100,
  badges: [],
  achievements: []
});

/**
 * Get DPP history for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Pagination and filtering options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of items per page
 * @param {string} [options.fromDate] - Start date for filtering
 * @param {string} [options.toDate] - End date for filtering
 * @param {string} [options.subjectId] - Subject ID for filtering
 * @param {string} [options.topicId] - Topic ID for filtering
 * @param {string} [options.difficulty] - Difficulty level for filtering
 * @param {boolean} [options.isCorrect] - Correctness filter
 * @returns {Promise<Object>} Paginated DPP history
 */
export const getDPPHistoryOld = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      fromDate,
      toDate,
      subjectId,
      topicId,
      difficulty,
      isCorrect,
    } = options;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      completedAt: { not: null },
    };

    // Apply filters
    if (fromDate || toDate) {
      where.completedAt = {
        ...(where.completedAt || {}),
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    if (subjectId || topicId || difficulty) {
      where.question = {
        ...(subjectId && { topic: { subjectId } }),
        ...(topicId && { topicId }),
        ...(difficulty && { difficulty }),
      };
    }

    if (typeof isCorrect === 'boolean') {
      where.isCorrect = isCorrect;
    }

    // Get paginated results
    const [items, total] = await Promise.all([
      prisma.dPPAssignment.findMany({
        where,
        include: {
          question: {
            include: {
              topic: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.dPPAssignment.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting DPP history:', error);
    throw new DPPError('Failed to get DPP history');
  }
};

/**
 * Skip a DPP question
 * @param {string} assignmentId - The DPP assignment ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The updated assignment with question details
 * @throws {DPPError} If assignment not found, unauthorized, or already completed
 */
/**
 * Generate a personalized practice test based on user's performance
 * @param {string} userId - The user ID
 * @param {Object} options - Test generation options
 * @param {number} [options.count=10] - Number of questions
 * @param {string[]} [options.subjects] - Specific subjects to include
 * @param {string[]} [options.topics] - Specific topics to include
 * @param {string[]} [options.difficulties] - Difficulty levels to include
 * @returns {Promise<Array>} Generated practice test questions
 */
export const generatePracticeTest = async (userId, options = {}) => {
  try {
    const {
      count = 10,
      subjects = [],
      topics = [],
      difficulties = ['easy', 'medium', 'hard'],
    } = options;

    // Get user's weak areas based on past performance
    const weakAreas = await prisma.$queryRaw`
      SELECT 
        q.topicId,
        t.name as topicName,
        t.subjectId,
        s.name as subjectName,
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0) as correctAttempts,
        ROUND(AVG(CASE WHEN a.isCorrect = true THEN 1.0 ELSE 0.0) * 100, 2) as accuracy
      FROM "DPPAssignment" a
      JOIN "Question" q ON a."questionId" = q.id
      JOIN "Topic" t ON q."topicId" = t.id
      JOIN "Subject" s ON t."subjectId" = s.id
      WHERE a."userId" = ${userId}
      GROUP BY q.topicId, t.name, t.subjectId, s.name
      HAVING COUNT(*) > 0
      ORDER BY accuracy ASC, totalAttempts DESC
      LIMIT 5
    `;

    // Get question IDs that the user has already attempted
    const attemptedQuestions = await prisma.dPPAssignment.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const attemptedQuestionIds = attemptedQuestions.map(q => q.questionId);

    // Build the query to find questions
    const where = {
      isActive: true,
      id: { notIn: attemptedQuestionIds },
      difficulty: { in: difficulties },
      ...(subjects.length > 0 && { topic: { subjectId: { in: subjects } } }),
      ...(topics.length > 0 && { topicId: { in: topics } }),
    };

    // If we have weak areas, prioritize those topics
    if (weakAreas.length > 0) {
      const weakTopicIds = weakAreas.map(area => area.topicId);
      where.OR = [
        { topicId: { in: weakTopicIds } },
        { ...where },
      ];
    }

    // Get questions
    const questions = await prisma.question.findMany({
      where,
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
      take: count,
      orderBy: {
        difficulty: 'asc', // Start with easier questions
      },
    });

    // If not enough questions, try to include some attempted ones with lower accuracy
    if (questions.length < count) {
      const remainingCount = count - questions.length;
      const attemptedWithLowAccuracy = await prisma.$queryRaw`
        SELECT q.*
        FROM "Question" q
        JOIN "DPPAssignment" a ON q.id = a."questionId"
        WHERE a."userId" = ${userId}
        AND a."isCorrect" = false
        AND q.id NOT IN (${questions.map(q => q.id).join(',') || 'NULL'})
        GROUP BY q.id
        ORDER BY COUNT(a.id) DESC, RANDOM()
        LIMIT ${remainingCount}
      `;
      
      questions.push(...attemptedWithLowAccuracy);
    }

    return questions;
  } catch (error) {
    console.error('Error generating practice test:', error);
    throw new DPPError('Failed to generate practice test');
  }
};

/**
 * Skip a DPP question
 * @param {string} assignmentId - The DPP assignment ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The updated assignment with question details
 * @throws {DPPError} If assignment not found, unauthorized, or already completed
 */
export const skipDPPQuestion = async (assignmentId, userId) => {
  try {
    // Get the assignment with question details
    const assignment = await prisma.dPPAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        question: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
        dpp: true,
      },
    });

    if (!assignment) {
      throw new DPPError('Assignment not found', 'NOT_FOUND');
    }

    if (assignment.userId !== userId) {
      throw new DPPError('Unauthorized to skip this question', 'UNAUTHORIZED');
    }

    if (assignment.status === 'COMPLETED') {
      throw new DPPError('Question already answered', 'ALREADY_ANSWERED');
    }

    // Mark as skipped
    const updatedAssignment = await prisma.dPPAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'SKIPPED',
        skippedAt: new Date(),
        metadata: {
          ...(assignment.metadata || {}),
          skippedAt: new Date(),
          skipReason: 'USER_SKIPPED',
        },
      },
      include: {
        question: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    // Update DPP progress
    await prisma.dPPProgress.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfToday(),
        },
      },
      update: {
        totalSkipped: { increment: 1 },
        lastActiveDate: new Date(),
      },
      create: {
        userId,
        date: startOfToday(),
        totalAssigned: 0,
        totalCompleted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalSkipped: 1,
        totalTimeSpent: 0,
        lastActiveDate: new Date(),
      },
    });

    // If this was the last question in the DPP, mark the DPP as completed
    if (assignment.dpp) {
      const remainingAssignments = await prisma.dPPAssignment.count({
        where: {
          dppId: assignment.dpp.id,
          status: 'PENDING',
        },
      });

      if (remainingAssignments === 0) {
        await prisma.dailyPracticeProblem.update({
          where: { id: assignment.dpp.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    }

    return {
      ...updatedAssignment,
      message: 'Question skipped successfully',
    };
  } catch (error) {
    console.error('Error skipping DPP question:', error);
    throw new DPPError(
      error.message || 'Failed to skip question',
      error.code || 'SKIP_FAILED'
    );
  }
};
