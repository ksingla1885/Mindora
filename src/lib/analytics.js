import prisma from './prisma';
import { startOfDay, endOfDay, subDays, format, isWithinInterval } from 'date-fns';

export async function trackEvent(eventData) {
  try {
    const { userId, eventType, metadata = {}, ...rest } = eventData;
    
    // Get user role if userId is provided
    let userRole = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      userRole = user?.role;
    }

    // Create the analytics event
    const event = await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId: userId || null,
        userRole,
        metadata: metadata || {},
        ...rest,
      },
    });

    return event;
  } catch (error) {
    console.error('Error tracking event:', error);
    throw error;
  }
}

export async function getDashboardStats({ startDate, endDate, userId = null }) {
  try {
    const where = {
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      userId: userId || undefined,
    };

    const [
      totalUsers,
      activeUsers,
      totalContentViews,
      totalTestAttempts,
      completionRate,
      recentActivity,
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: {
          createdAt: where.createdAt,
        },
      }),
      
      // Active users (users with activity in the last 7 days)
      prisma.user.count({
        where: {
          OR: [
            {
              studySessions: {
                some: {
                  startTime: {
                    gte: subDays(new Date(), 7),
                  },
                },
              },
            },
            {
              testAttempts: {
                some: {
                  startTime: {
                    gte: subDays(new Date(), 7),
                  },
                },
              },
            },
          ],
        },
      }),
      
      // Total content views
      prisma.analyticsEvent.count({
        where: {
          ...where,
          eventType: 'content_view',
        },
      }),
      
      // Total test attempts
      prisma.testAttempt.count({
        where: {
          createdAt: where.createdAt,
        },
      }),
      
      // Average completion rate for all content
      (async () => {
        const completed = await prisma.learningProgress.count({
          where: {
            ...where,
            status: 'completed',
          },
        });
        
        const total = await prisma.learningProgress.count({
          where: where,
        });
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      })(),
      
      // Recent activity
      prisma.analyticsEvent.findMany({
        where: {
          ...where,
          eventType: {
            in: ['content_view', 'test_start', 'test_complete', 'login'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalContentViews,
      totalTestAttempts,
      completionRate,
      recentActivity,
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

export async function getUserProgress(userId, { startDate, endDate }) {
  try {
    const where = {
      userId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        },
      } : {}),
    };

    const [
      totalTimeSpent,
      completedContent,
      testScores,
      progressBySubject,
      recentActivity,
      streakInfo,
    ] = await Promise.all([
      // Total time spent
      prisma.studySession.aggregate({
        where: {
          userId,
          startTime: where.createdAt,
        },
        _sum: {
          duration: true,
        },
      }),
      
      // Completed content
      prisma.learningProgress.findMany({
        where: {
          ...where,
          status: 'completed',
        },
        include: {
          contentItem: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          test: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 5,
      }),
      
      // Test scores
      prisma.testAttempt.findMany({
        where: {
          userId,
          status: 'evaluated',
          startTime: where.createdAt,
        },
        select: {
          id: true,
          score: true,
          startTime: true,
          test: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        take: 5,
      }),
      
      // Progress by subject
      prisma.learningProgress.groupBy({
        by: ['topicId'],
        where: {
          userId,
          topicId: { not: null },
        },
        _avg: {
          progress: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _avg: {
            progress: 'desc',
          },
        },
      }),
      
      // Recent activity
      prisma.analyticsEvent.findMany({
        where: {
          userId,
          eventType: {
            in: ['content_view', 'test_start', 'test_complete'],
          },
          createdAt: where.createdAt,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      
      // Streak information
      (async () => {
        // Get all unique days with activity
        const activityDays = await prisma.studySession.findMany({
          where: { userId },
          select: { startTime: true },
          distinct: ['startTime'],
        });

        // Convert to dates and sort
        const dates = activityDays
          .map(a => startOfDay(new Date(a.startTime)).toISOString())
          .sort()
          .map(d => new Date(d));

        // Calculate current streak
        let currentStreak = 0;
        let currentDate = new Date();
        
        // Check if there was activity today or yesterday
        const today = startOfDay(new Date());
        const yesterday = startOfDay(subDays(new Date(), 1));
        
        const hasActivityToday = dates.some(d => 
          d.getTime() === today.getTime()
        );
        
        const hasActivityYesterday = dates.some(d => 
          d.getTime() === yesterday.getTime()
        );
        
        if (hasActivityToday) {
          currentStreak++;
          currentDate = subDays(currentDate, 1);
        } else if (hasActivityYesterday) {
          currentDate = subDays(currentDate, 2);
        } else {
          return { currentStreak: 0, longestStreak: 0 };
        }
        
        // Count consecutive days with activity
        while (true) {
          const prevDate = startOfDay(subDays(currentDate, 1));
          const hasActivity = dates.some(d => 
            d.getTime() === prevDate.getTime()
          );
          
          if (hasActivity) {
            currentStreak++;
            currentDate = prevDate;
          } else {
            break;
          }
        }
        
        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 1;
        
        for (let i = 1; i < dates.length; i++) {
          const prevDate = dates[i - 1];
          const currDate = dates[i];
          
          const diffInDays = Math.round(
            (currDate - prevDate) / (1000 * 60 * 60 * 24)
          );
          
          if (diffInDays === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else if (diffInDays > 1) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        
        return {
          currentStreak,
          longestStreak,
        };
      })(),
    ]);

    // Process progress by subject to include subject and topic names
    const progressWithSubjects = await Promise.all(
      progressBySubject.map(async (item) => {
        const topic = await prisma.topic.findUnique({
          where: { id: item.topicId },
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        
        return {
          ...item,
          topic,
        };
      })
    );

    return {
      totalTimeSpent: totalTimeSpent._sum.duration || 0,
      completedContent: completedContent.map(item => ({
        ...item,
        title: item.contentItem?.title || item.test?.title,
        type: item.contentItem?.type || 'test',
      })),
      testScores: testScores.map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        date: attempt.startTime,
        test: attempt.test,
      })),
      progressBySubject: progressWithSubjects,
      recentActivity,
      ...streakInfo,
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
}

export async function getContentAnalytics(contentId, { startDate, endDate }) {
  try {
    const where = {
      contentItemId: contentId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        },
      } : {}),
    };

    const [
      totalViews,
      uniqueViewers,
      averageTimeSpent,
      completionRate,
      progressData,
      engagementOverTime,
    ] = await Promise.all([
      // Total views
      prisma.analyticsEvent.count({
        where: {
          ...where,
          eventType: 'content_view',
        },
      }),
      
      // Unique viewers
      prisma.analyticsEvent.count({
        where: {
          ...where,
          eventType: 'content_view',
        },
        distinct: ['userId'],
      }),
      
      // Average time spent
      prisma.studySession.aggregate({
        where: {
          contentItemId: contentId,
          startTime: where.createdAt,
        },
        _avg: {
          duration: true,
        },
      }),
      
      // Completion rate
      (async () => {
        const completed = await prisma.learningProgress.count({
          where: {
            ...where,
            status: 'completed',
          },
        });
        
        const total = await prisma.learningProgress.count({
          where: where,
        });
        
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      })(),
      
      // Progress data
      prisma.learningProgress.findMany({
        where: where,
        select: {
          id: true,
          progress: true,
          status: true,
          timeSpent: true,
          lastAccessedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      }),
      
      // Engagement over time (last 30 days)
      (async () => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        
        const sessions = await prisma.studySession.findMany({
          where: {
            contentItemId: contentId,
            startTime: {
              gte: thirtyDaysAgo,
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          },
          select: {
            startTime: true,
            duration: true,
          },
          orderBy: {
            startTime: 'asc',
          },
        });
        
        // Group by day
        const dailyData = {};
        
        sessions.forEach(session => {
          const date = format(startOfDay(session.startTime), 'yyyy-MM-dd');
          
          if (!dailyData[date]) {
            dailyData[date] = {
              date,
              views: 0,
              totalDuration: 0,
              sessions: 0,
            };
          }
          
          dailyData[date].views++;
          dailyData[date].totalDuration += session.duration || 0;
          dailyData[date].sessions++;
        });
        
        // Fill in missing days with zeros
        const result = [];
        let currentDate = thirtyDaysAgo;
        const today = new Date();
        
        while (currentDate <= today) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          result.push({
            date: dateStr,
            views: dailyData[dateStr]?.views || 0,
            avgDuration: dailyData[dateStr] 
              ? Math.round(dailyData[dateStr].totalDuration / dailyData[dateStr].sessions) 
              : 0,
          });
          
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return result;
      })(),
    ]);

    return {
      totalViews,
      uniqueViewers,
      averageTimeSpent: averageTimeSpent._avg.duration || 0,
      completionRate,
      progressData: progressData.map(item => ({
        ...item,
        user: {
          id: item.user.id,
          name: item.user.name || 'Anonymous',
          email: item.user.email,
        },
      })),
      engagementOverTime,
    };
  } catch (error) {
    console.error('Error getting content analytics:', error);
    throw error;
  }
}
