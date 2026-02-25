import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/services/notification/notification.service';
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

/**
 * Custom error class for DPP-related errors
 */
class DPPError extends Error {
  constructor(message, code = 'DPP_ERROR') {
    super(message);
    this.name = 'DPPError';
    this.code = code;
  }
}

/**
 * Helper to check if the user's answer for a question is correct
 */
const checkAnswer = (question, answer) => {
  if (!question || !answer) return false;

  const type = (question.type || '').toLowerCase();
  const normalizedUserAnswer = String(answer).trim().toLowerCase();
  const normalizedCorrectAnswer = String(question.correctAnswer || '').trim().toLowerCase();

  if (type === 'mcq' || type === 'true_false') {
    return question.correctAnswer === answer;
  }

  if (type === 'short_answer') {
    return normalizedUserAnswer === normalizedCorrectAnswer;
  }

  // Fallback for other types
  return !!answer;
};

/**
 * Update the user's overall DPP progress
 */
const updateUserDPPProgress = async (userId, isCorrect) => {
  const today = startOfToday();
  return prisma.dPPProgress.upsert({
    where: { userId },
    update: {
      totalCompleted: { increment: 1 },
      correctAnswers: isCorrect ? { increment: 1 } : undefined,
      lastActiveDate: new Date(),
    },
    create: {
      userId,
      date: today,
      totalAssigned: 1,
      totalCompleted: 1,
      correctAnswers: isCorrect ? 1 : 0,
      lastActiveDate: new Date(),
    }
  });
};

/**
 * Calculate and update the user's daily streak
 */
const calculateAndUpdateStreak = async (userId) => {
  const progress = await prisma.dPPProgress.findUnique({
    where: { userId },
  });
  if (!progress) return;

  const now = new Date();
  const lastActive = progress.lastActiveDate;
  let currentStreak = progress.currentStreak;
  let longestStreak = progress.longestStreak;

  if (lastActive) {
    const diff = differenceInDays(now, lastActive);
    if (diff === 1) {
      currentStreak += 1;
    } else if (diff > 1) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await prisma.dPPProgress.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActiveDate: now,
    }
  });
};

/**
 * Get or create DPP configuration for a user
 */
export const getOrCreateDPPConfig = async (userId) => {
  try {
    let config = await prisma.dPPConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      config = await prisma.dPPConfig.create({
        data: {
          userId,
          dailyLimit: 5,
          difficulty: ['medium'],
          subjects: [],
        },
      });
    }
    return config;
  } catch (error) {
    console.error('Error in getOrCreateDPPConfig:', error);
    throw new DPPError('Failed to fetch DPP configuration');
  }
};

/**
 * Update DPP configuration for a user
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
 * Get today's DPP assignments for a user
 */
export const getTodaysDPP = async (userId, includeCompleted = false) => {
  try {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    let dpp = await prisma.dailyPracticeProblem.findFirst({
      where: {
        userId,
        date: { gte: todayStart, lte: todayEnd }
      },
      include: {
        assignments: {
          include: {
            question: {
              include: {
                topic: { include: { subject: true } }
              }
            }
          },
          orderBy: { sequence: 'asc' },
          where: includeCompleted ? {} : { status: 'PENDING' }
        }
      }
    });

    if (!dpp) {
      dpp = await generateDPP(userId);
    } else if (!dpp.assignments || dpp.assignments.length === 0) {
      const count = await prisma.dPPAssignment.count({ where: { dppId: dpp.id } });
      if (count === 0) {
        await prisma.dailyPracticeProblem.delete({ where: { id: dpp.id } });
        dpp = await generateDPP(userId);
      }
    }

    const items = dpp.assignments || [];
    return items.map(q => ({
      id: q.id,
      question: q.question,
      status: q.status,
      userAnswer: q.userAnswer,
      isCorrect: q.isCorrect,
      timeSpent: q.timeSpent,
      submittedAt: q.submittedAt,
      sequence: q.sequence
    }));
  } catch (error) {
    console.error('Error getting today\'s DPP:', error);
    throw new DPPError('Failed to fetch today\'s DPP');
  }
};

/**
 * Generate new DPP assignments for a user
 */
export const generateDPP = async (userId, count) => {
  try {
    const config = await getOrCreateDPPConfig(userId);
    const limit = count || config.dailyLimit || 5;

    const completedAssignments = await prisma.dPPAssignment.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { questionId: true },
    });
    const excludedIds = completedAssignments.map(a => a.questionId);

    const questions = await prisma.question.findMany({
      where: {
        id: { notIn: excludedIds },
        topic: {
          subjectId: config.subjects.length > 0 ? { in: config.subjects } : undefined
        },
        difficulty: config.difficulty.length > 0 ? { in: config.difficulty } : undefined,
        isActive: true
      },
      take: limit,
      orderBy: { attempts: 'asc' }
    });

    if (questions.length === 0) {
      throw new DPPError('No new questions available for your settings.', 'NO_QUESTIONS');
    }

    const todayDPP = await prisma.dailyPracticeProblem.create({
      data: {
        userId,
        date: startOfToday(),
        status: 'PENDING',
        assignments: {
          create: questions.map((q, index) => ({
            userId,
            questionId: q.id,
            sequence: index + 1,
            status: 'PENDING'
          }))
        }
      },
      include: {
        assignments: {
          include: {
            question: {
              include: {
                topic: { include: { subject: true } }
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    await prisma.dPPProgress.upsert({
      where: { userId },
      update: { totalAssigned: { increment: questions.length } },
      create: {
        userId,
        date: startOfToday(),
        totalAssigned: questions.length,
        totalCompleted: 0,
        correctAnswers: 0,
      }
    });

    if (config.notifications) {
      await sendNotification({
        userId,
        title: 'New Daily Practice Problems',
        message: `You have ${questions.length} new practice questions waiting for you!`,
        type: 'DPP_ASSIGNED',
        data: { dppId: todayDPP.id }
      });
    }

    return todayDPP;
  } catch (error) {
    console.error('Error in generateDPP:', error);
    if (error instanceof DPPError) throw error;
    throw new DPPError('Failed to generate Daily Practice Problems');
  }
};

/**
 * Submit an answer for a specific DPP question
 */
export const submitDPPAnswer = async (assignmentId, userId, answer, metadata = {}) => {
  try {
    const assignment = await prisma.dPPAssignment.findUnique({
      where: { id: assignmentId },
      include: { question: true, dpp: true },
    });

    if (!assignment) throw new DPPError('Assignment not found', 'NOT_FOUND');
    if (assignment.userId !== userId) throw new DPPError('Unauthorized', 'UNAUTHORIZED');
    if (assignment.status === 'COMPLETED') throw new DPPError('Already answered', 'ALREADY_ANSWERED');

    const isCorrect = checkAnswer(assignment.question, answer);
    const timeSpent = metadata.timeSpent || 0;

    const updatedAssignment = await prisma.dPPAssignment.update({
      where: { id: assignmentId },
      data: {
        userAnswer: answer,
        isCorrect,
        submittedAt: new Date(),
        status: 'COMPLETED',
        timeSpent,
      },
      include: {
        question: {
          include: {
            topic: {
              include: { subject: true }
            }
          }
        }
      }
    });

    await updateUserDPPProgress(userId, isCorrect);
    await calculateAndUpdateStreak(userId);

    const remaining = await prisma.dPPAssignment.count({
      where: { dppId: assignment.dppId, status: 'PENDING' }
    });

    if (remaining === 0) {
      await prisma.dailyPracticeProblem.update({
        where: { id: assignment.dppId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
    }

    return {
      ...updatedAssignment,
      correctAnswer: isCorrect ? undefined : assignment.question.correctAnswer,
      explanation: isCorrect ? undefined : assignment.question.explanation,
    };
  } catch (error) {
    console.error('Error in submitDPPAnswer:', error);
    if (error instanceof DPPError) throw error;
    throw new DPPError('Failed to submit answer');
  }
};

/**
 * Skip a DPP question
 */
export const skipDPPQuestion = async (assignmentId, userId) => {
  try {
    const assignment = await prisma.dPPAssignment.findUnique({
      where: { id: assignmentId },
      include: { dpp: true },
    });

    if (!assignment) throw new DPPError('Assignment not found', 'NOT_FOUND');
    if (assignment.userId !== userId) throw new DPPError('Unauthorized', 'UNAUTHORIZED');
    if (assignment.status === 'COMPLETED') throw new DPPError('Already completed', 'ALREADY_COMPLETED');

    const updatedAssignment = await prisma.dPPAssignment.update({
      where: { id: assignmentId },
      data: { status: 'SKIPPED' }
    });

    const remaining = await prisma.dPPAssignment.count({
      where: { dppId: assignment.dppId, status: 'PENDING' }
    });

    if (remaining === 0) {
      await prisma.dailyPracticeProblem.update({
        where: { id: assignment.dppId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
    }

    return updatedAssignment;
  } catch (error) {
    console.error('Error in skipDPPQuestion:', error);
    throw new DPPError('Failed to skip question');
  }
};

/**
 * Get user stats for DPP
 */
export const getDPPStats = async (userId) => {
  try {
    const progress = await prisma.dPPProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return {
        totalAssigned: 0,
        totalCompleted: 0,
        correctAnswers: 0,
        accuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    return {
      ...progress,
      accuracy: progress.totalCompleted > 0 ? (progress.correctAnswers / progress.totalCompleted) * 100 : 0
    };
  } catch (error) {
    console.error('Error in getDPPStats:', error);
    throw new DPPError('Failed to fetch stats');
  }
};

/**
 * Get DPP history for a user
 */
export const getDPPHistory = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.dPPAssignment.findMany({
        where: { userId, status: 'COMPLETED' },
        include: {
          question: {
            include: { topic: { include: { subject: true } } }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dPPAssignment.count({ where: { userId, status: 'COMPLETED' } })
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error in getDPPHistory:', error);
    throw new DPPError('Failed to fetch history');
  }
};
