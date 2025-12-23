import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    let startDate;
    switch (range) {
      case '7d':
        startDate = subDays(new Date(), 7);
        break;
      case '30d':
        startDate = subDays(new Date(), 30);
        break;
      case '90d':
        startDate = subDays(new Date(), 90);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get all days in the date range
    const days = eachDayOfInterval({
      start: startDate,
      end: new Date(),
    });

    // Get study sessions for the date range
    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
        },
      },
      select: {
        startTime: true,
        duration: true,
        contentItem: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Get test attempts for the date range
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
        },
      },
      select: {
        startTime: true,
        test: {
          select: {
            title: true,
            questions: true,
          },
        },
        score: true,
      },
    });

    // Group study time by day
    const dailyStudyTime = {};
    studySessions.forEach((session) => {
      const date = format(startOfDay(session.startTime), 'yyyy-MM-dd');
      if (!dailyStudyTime[date]) {
        dailyStudyTime[date] = 0;
      }
      dailyStudyTime[date] += session.duration || 0;
    });

    // Group questions answered by day
    const dailyQuestions = {};
    testAttempts.forEach((attempt) => {
      const date = format(startOfDay(attempt.startTime), 'yyyy-MM-dd');
      if (!dailyQuestions[date]) {
        dailyQuestions[date] = 0;
      }
      dailyQuestions[date] += attempt.test.questions.length;
    });

    // Group test scores by day
    const dailyScores = {};
    testAttempts.forEach((attempt) => {
      const date = format(startOfDay(attempt.startTime), 'yyyy-MM-dd');
      if (!dailyScores[date]) {
        dailyScores[date] = [];
      }
      dailyScores[date].push(attempt.score || 0);
    });

    // Format the data for the chart
    const activityData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const avgScore = dailyScores[dateStr] 
        ? dailyScores[dateStr].reduce((a, b) => a + b, 0) / dailyScores[dateStr].length 
        : null;

      return {
        date: format(day, 'MMM d'),
        fullDate: dateStr,
        minutesStudied: Math.round((dailyStudyTime[dateStr] || 0) / 60),
        questionsAnswered: dailyQuestions[dateStr] || 0,
        testScore: avgScore !== null ? Math.round(avgScore * 100) : null,
      };
    });

    // Get most active times of day
    const hours = Array(24).fill(0);
    studySessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours();
      hours[hour] += session.duration || 0;
    });

    const mostActiveHour = hours.indexOf(Math.max(...hours));

    // Get most studied subjects
    const subjectTime = {};
    studySessions.forEach((session) => {
      if (session.contentItem) {
        const subject = session.contentItem.title.split(' - ')[0];
        subjectTime[subject] = (subjectTime[subject] || 0) + (session.duration || 0);
      }
    });

    const mostStudiedSubject = Object.entries(subjectTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([subject]) => subject);

    return NextResponse.json({
      data: activityData,
      insights: {
        mostActiveHour: `${mostActiveHour}:00 - ${mostActiveHour + 1}:00`,
        mostStudiedSubject,
        totalStudySessions: studySessions.length,
        totalTestAttempts: testAttempts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}
