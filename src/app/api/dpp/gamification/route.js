import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [badges, achievements, leaderboard] = await Promise.all([
      // User's badges
      prisma.badge.findMany({
        where: { userId: session.user.id },
        orderBy: { awardedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          icon: true,
          awardedAt: true,
          rarity: true
        }
      }),
      
      // User's achievements
      prisma.achievement.findMany({
        where: { userId: session.user.id },
        orderBy: { unlockedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          points: true,
          unlockedAt: true,
          icon: true
        }
      }),
      
      // Leaderboard (top 10 users by points)
      prisma.$queryRaw`
        SELECT 
          u.id, 
          u.name, 
          u.image,
          up.points,
          RANK() OVER (ORDER BY up.points DESC) as rank
        FROM "User" u
        JOIN "UserProgress" up ON up."userId" = u.id
        WHERE u.role = 'STUDENT'
        ORDER BY up.points DESC
        LIMIT 10
      `
    ]);

    // Calculate user's rank
    const userRank = await prisma.$queryRaw`
      SELECT rank FROM (
        SELECT 
          "userId", 
          RANK() OVER (ORDER BY points DESC) as rank
        FROM "UserProgress"
        WHERE "userId" IN (
          SELECT id FROM "User" WHERE role = 'STUDENT'
        )
      ) ranked
      WHERE "userId" = ${session.user.id}
    `;

    const userStats = await prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      select: {
        points: true,
        currentStreak: true,
        maxStreak: true,
        totalDPPAttempts: true,
        correctDPPAnswers: true,
        lastActive: true
      }
    });

    const dailyChallenge = await getDailyChallenge(session.user.id);

    return new Response(JSON.stringify({
      badges,
      achievements,
      leaderboard,
      userRank: userRank[0]?.rank || 0,
      stats: userStats,
      dailyChallenge,
      nextLevelPoints: Math.pow(Math.floor(Math.sqrt((userStats?.points || 0) / 100)) + 1, 2) * 100 - (userStats?.points || 0),
      currentLevel: Math.floor(Math.sqrt((userStats?.points || 0) / 100)) + 1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch gamification data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function getDailyChallenge(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  const existingChallenge = await prisma.dailyChallenge.findFirst({
    where: {
      userId,
      date: {
        gte: new Date(today),
        lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    },
    include: {
      questions: {
        include: {
          question: {
            include: {
              topic: {
                select: { name: true, subject: { select: { name: true } } }
              }
            }
          }
        }
      }
    }
  });

  if (existingChallenge) {
    return {
      id: existingChallenge.id,
      date: existingChallenge.date,
      completed: existingChallenge.completed,
      questions: existingChallenge.questions.map(q => ({
        id: q.question.id,
        text: q.question.text,
        topic: q.question.topic.name,
        subject: q.question.topic.subject.name,
        difficulty: q.question.difficulty,
        isCorrect: q.isCorrect,
        submittedAt: q.submittedAt
      })),
      progress: {
        completed: existingChallenge.questions.filter(q => q.submittedAt).length,
        total: existingChallenge.questions.length
      }
    };
  }

  // Create new daily challenge if none exists for today
  const questions = await prisma.$queryRaw`
    SELECT q.* 
    FROM "Question" q
    JOIN "Topic" t ON q."topicId" = t.id
    WHERE q.difficulty IN ('EASY', 'MEDIUM')
    AND q.id NOT IN (
      SELECT "questionId" 
      FROM "DPPAttempt" 
      WHERE "userId" = ${userId} 
      AND "isCorrect" = true
    )
    ORDER BY RANDOM()
    LIMIT 5
  `;

  if (questions.length === 0) return null;

  const newChallenge = await prisma.dailyChallenge.create({
    data: {
      userId,
      date: new Date(),
      questions: {
        create: questions.map((q, index) => ({
          questionId: q.id,
          order: index + 1
        }))
      }
    },
    include: {
      questions: {
        include: {
          question: {
            include: {
              topic: {
                select: { name: true, subject: { select: { name: true } } }
              }
            }
          }
        }
      }
    }
  });

  return {
    id: newChallenge.id,
    date: newChallenge.date,
    completed: false,
    questions: newChallenge.questions.map(q => ({
      id: q.question.id,
      text: q.question.text,
      topic: q.question.topic.name,
      subject: q.question.topic.subject.name,
      difficulty: q.question.difficulty,
      isCorrect: q.isCorrect,
      submittedAt: q.submittedAt
    })),
    progress: {
      completed: 0,
      total: newChallenge.questions.length
    }
  };
}
