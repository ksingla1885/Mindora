import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Get all subjects with progress
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: {
            contentItems: {
              select: {
                id: true,
                title: true,
                type: true,
                _count: {
                  select: { studySessions: true },
                },
              },
            },
            questions: {
              select: {
                id: true,
                difficulty: true,
                _count: {
                  select: { attempts: true },
                },
              },
            },
            learningProgress: {
              where: { userId },
              select: {
                status: true,
                lastStudied: true,
                notes: true,
              },
            },
          },
        },
      },
    });

    // Calculate progress for each subject
    const progressData = subjects.map((subject) => {
      const topics = subject.topics || [];
      const totalTopics = topics.length;
      const completedTopics = topics.filter(
        (topic) => topic.learningProgress[0]?.status === 'COMPLETED'
      ).length;
      const inProgressTopics = topics.filter(
        (topic) =>
          topic.learningProgress[0]?.status === 'IN_PROGRESS' ||
          topic.learningProgress[0]?.status === 'REVIEW_NEEDED'
      ).length;

      // Calculate accuracy for this subject
      const questions = topics.flatMap((topic) => topic.questions);
      const totalQuestions = questions.length;
      const totalAttempts = questions.reduce(
        (sum, q) => sum + (q._count?.attempts || 0),
        0
      );
      
      // Get test attempts for this subject
      const testAttempts = topics.flatMap((topic) =>
        topic.questions.flatMap((q) => q.attempts || [])
      );
      
      const correctAttempts = testAttempts.filter(
        (a) => a.isCorrect
      ).length;
      const accuracy =
        totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

      return {
        subject: subject.name,
        totalTopics,
        completedTopics,
        inProgressTopics,
        notStartedTopics: totalTopics - completedTopics - inProgressTopics,
        completion: Math.round((completedTopics / totalTopics) * 100) || 0,
        accuracy,
        totalQuestions,
        totalAttempts,
        lastStudied: topics.reduce((latest, topic) => {
          const lastStudied = topic.learningProgress[0]?.lastStudied;
          return lastStudied && (!latest || lastStudied > latest)
            ? lastStudied
            : latest;
        }, null),
      };
    });

    // Calculate overall progress
    const totalTopics = progressData.reduce((sum, subj) => sum + subj.totalTopics, 0);
    const completedTopics = progressData.reduce(
      (sum, subj) => sum + subj.completedTopics,
      0
    );
    const overallCompletion =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Get recent activity
    const recentActivity = await prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { lastStudied: 'desc' },
      take: 5,
      include: {
        topic: {
          select: {
            name: true,
            subject: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Get upcoming deadlines (e.g., tests, assignments)
    const upcomingDeadlines = await prisma.test.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
        registrations: {
          some: {
            userId,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        startTime: true,
        durationMinutes: true,
      },
    });

    return NextResponse.json({
      data: {
        subjects: progressData,
        overall: {
          completion: overallCompletion,
          accuracy: Math.round(
            progressData.reduce((sum, subj) => sum + subj.accuracy, 0) /
              Math.max(1, progressData.length)
          ),
          totalTopics,
          completedTopics,
          inProgressTopics: progressData.reduce(
            (sum, subj) => sum + subj.inProgressTopics,
            0
          ),
          totalQuestions: progressData.reduce(
            (sum, subj) => sum + subj.totalQuestions,
            0
          ),
          totalAttempts: progressData.reduce(
            (sum, subj) => sum + subj.totalAttempts,
            0
          ),
        },
        recentActivity: recentActivity.map((activity) => ({
          id: activity.id,
          topic: activity.topic.name,
          subject: activity.topic.subject.name,
          status: activity.status,
          lastStudied: activity.lastStudied,
        })),
        upcomingDeadlines: upcomingDeadlines.map((deadline) => ({
          id: deadline.id,
          title: deadline.title,
          dueDate: deadline.startTime,
          duration: deadline.durationMinutes,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}
