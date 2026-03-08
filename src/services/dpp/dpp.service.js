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

    // 1. Fetch user to get their class
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { class: true }
    });
    const userClass = user?.class ? String(user.class) : "General";

    // 2. Search for all relevant DPPs for today
    let dpps = await prisma.dailyPracticeProblem.findMany({
      where: {
        AND: [
          { date: { gte: todayStart, lte: todayEnd } },
          {
            OR: [
              { userId: userId },
              { userId: null, class: userClass },
              { userId: null, class: null }
            ]
          }
        ]
      },
      include: {
        assignments: {
          where: { userId },
          include: {
            question: {
              include: {
                topic: { include: { subject: true } }
              }
            }
          },
          orderBy: { sequence: 'asc' }
        },
        questions: {
          include: {
            question: {
              include: {
                topic: { include: { subject: true } }
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Separate admin DPPs and personalized ones
    const adminDPPs = dpps.filter(d => d.userId === null);

    // 4. Ensure we prioritize admin content. 
    // If admin sets exist for the class, we ONLY use those.
    if (adminDPPs.length > 0) {
      dpps = adminDPPs;
    }

    // Deduplicate DPPs just in case any overlap exists
    const uniqueDpps = [];
    const seenIds = new Set();
    for (const d of dpps) {
      if (!seenIds.has(d.id)) {
        uniqueDpps.push(d);
        seenIds.add(d.id);
      }
    }
    dpps = uniqueDpps;

    const allAssignments = [];

    // 4. Process each DPP to ensure assignments exist
    if (dpps && dpps.length > 0) {
      for (const dpp of dpps) {
        if (!dpp) continue;
        let currentAssignments = dpp.assignments || [];

        // Sync assignments with current DPP questions
        const currentAssignmentQIds = new Set((dpp.assignments || []).map(a => a.questionId));
        const dppQuestionIds = dpp.questions.map(dq => dq.questionId);

        // 1. Identify missing assignments
        const missingQIds = dppQuestionIds.filter(id => !currentAssignmentQIds.has(id));

        if (missingQIds.length > 0) {
          try {
            const newAssignments = await prisma.$transaction(
              missingQIds.map(qId => {
                const dq = dpp.questions.find(x => x.questionId === qId);
                return prisma.dPPAssignment.create({
                  data: {
                    userId,
                    dppId: dpp.id,
                    questionId: qId,
                    sequence: dq?.sequence || 0,
                    status: 'PENDING'
                  },
                  include: {
                    question: {
                      include: {
                        topic: { include: { subject: true } }
                      }
                    }
                  }
                });
              })
            );
            // Combine with existing
            currentAssignments = [...(dpp.assignments || []), ...newAssignments];
          } catch (createError) {
            console.error(`Failed to sync assignments for DPP ${dpp.id}:`, createError);
            currentAssignments = dpp.assignments || [];
          }
        } else {
          currentAssignments = dpp.assignments || [];
        }

        // 2. Filter out assignments that are no longer in the DPP (Admin removed them)
        const activeAssignments = currentAssignments.filter(a => dppQuestionIds.includes(a.questionId));

        // 3. Add to total list (filtering by status if needed)
        const filtered = includeCompleted
          ? activeAssignments
          : activeAssignments.filter(a => a.status === 'PENDING');

        allAssignments.push(...filtered);
      }
    }

    // Safety check for personalized empty DPPs (re-generating if needed)
    if (allAssignments.length === 0 && dpps.length === 1 && dpps[0] && dpps[0].userId === userId && !includeCompleted) {
      const count = await prisma.dPPAssignment.count({ where: { dppId: dpps[0].id, userId } });
      if (count === 0) {
        try {
          await prisma.dailyPracticeProblem.delete({ where: { id: dpps[0].id } });
          return getTodaysDPP(userId, includeCompleted);
        } catch (e) {
          console.warn('Cleanup of empty DPP failed');
        }
      }
    }

    const dppsWithAssignments = dpps.map(dpp => {
      const dppAssignments = allAssignments.filter(a => a.dppId === dpp.id);
      return {
        ...dpp,
        assignments: dppAssignments
      };
    });

    // Deduplicate top-level assignments by questionId
    const finalAssignments = [];
    const seenGlobalQIds = new Set();
    for (const a of allAssignments) {
      if (!seenGlobalQIds.has(a.questionId)) {
        finalAssignments.push(a);
        seenGlobalQIds.add(a.questionId);
      }
    }

    return {
      dpp: dpps[0],
      assignments: finalAssignments.map(q => ({
        id: q.id,
        question: q.question,
        status: q.status,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        timeSpent: q.timeSpent,
        submittedAt: q.submittedAt,
        sequence: q.sequence
      })),
      dpps: dppsWithAssignments.map(d => {
        const seenLocalQIds = new Set();
        const uniqueLocalAssignments = d.assignments.filter(a => {
          if (seenLocalQIds.has(a.questionId)) return false;
          seenLocalQIds.add(a.questionId);
          return true;
        });

        return {
          id: d.id,
          date: d.date,
          status: d.status,
          class: d.class,
          subject: d.assignments[0]?.question?.topic?.subject || { name: "Daily Practice" },
          questions: uniqueLocalAssignments.map(a => ({
            id: a.id,
            status: a.status,
            userAnswer: a.userAnswer,
            isCorrect: a.isCorrect,
            timeSpent: a.timeSpent,
            submittedAt: a.submittedAt,
            question: {
              id: a.question.id,
              text: a.question.text,
              type: a.question.type,
              options: a.question.options,
              correctAnswer: a.question.correctAnswer,
              explanation: a.question.explanation
            }
          }))
        };
      })
    };
  } catch (error) {
    console.error('Error getting today\'s DPP:', error);
    if (error instanceof DPPError) throw error;
    return { dpp: null, assignments: [], dpps: [] };
  }
};

/**
 * Generate new DPP assignments for a user
 */
export const generateDPP = async (userId, count, userClass) => {
  try {
    const config = await getOrCreateDPPConfig(userId);
    const limit = count || config.dailyLimit || 5;

    // Use passed class or fetch user's class if not provided
    let finalClass = userClass;
    if (!finalClass) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { class: true } });
      finalClass = user?.class ? String(user.class) : undefined;
    }

    const completedAssignments = await prisma.dPPAssignment.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { questionId: true },
    });
    const excludedIds = completedAssignments.map(a => a.questionId);

    const questions = await prisma.question.findMany({
      where: {
        id: { notIn: excludedIds },
        topic: {
          subject: {
            id: config.subjects.length > 0 ? { in: config.subjects } : undefined,
            OR: finalClass ? [{ class: finalClass }, { class: null }] : undefined
          }
        },
        difficulty: config.difficulty.length > 0 ? { in: config.difficulty } : undefined,
        isActive: true
      },
      take: limit,
      orderBy: { attempts: 'asc' }
    });

    if (questions.length === 0) {
      return null;
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
