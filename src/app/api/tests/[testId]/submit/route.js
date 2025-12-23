import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { testId } = params;
  const userId = session.user.id;

  try {
    const { answers, timeSpent } = await request.json();

    // Get the active attempt
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId,
        submittedAt: null,
      },
      include: {
        test: {
          include: {
            questions: {
              include: {
                question: true,
              },
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'No active test attempt found' },
        { status: 400 }
      );
    }

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    const questionDetails = [];

    attempt.test.questions.forEach((testQuestion, index) => {
      const question = testQuestion.question;
      const userAnswer = answers[index]?.answer || null;
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += testQuestion.marks || 1;
        correctAnswers++;
      }

      questionDetails.push({
        questionId: question.id,
        questionText: question.text,
        correctAnswer: question.correctAnswer,
        userAnswer,
        isCorrect,
        marks: testQuestion.marks || 1,
        explanation: question.explanation,
      });
    });

    const totalQuestions = attempt.test.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = timeSpent || 0;

    // Update the attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        score,
        percentage,
        timeTaken,
        details: questionDetails,
      },
    });

    // Update leaderboard
    await updateLeaderboard(userId, testId, score, percentage);

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      score,
      percentage,
      correctAnswers,
      totalQuestions,
      timeTaken,
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    );
  }
}

async function updateLeaderboard(userId, testId, score, percentage) {
  // Get test subject for leaderboard
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { subjectId: true },
  });

  if (!test) return;

  // Update or create leaderboard entry
  await prisma.leaderboard.upsert({
    where: {
      userId_subjectId: {
        userId,
        subjectId: test.subjectId,
      },
    },
    update: {
      score: {
        increment: score,
      },
      lastUpdated: new Date(),
    },
    create: {
      userId,
      subjectId: test.subjectId,
      score,
      lastUpdated: new Date(),
    },
  });

  // Update overall leaderboard (subjectId = null)
  await prisma.leaderboard.upsert({
    where: {
      userId_subjectId: {
        userId,
        subjectId: null,
      },
    },
    update: {
      score: {
        increment: score,
      },
      lastUpdated: new Date(),
    },
    create: {
      userId,
      subjectId: null,
      score,
      lastUpdated: new Date(),
    },
  });

  // Update ranks
  await updateRanks(test.subjectId);
  await updateRanks(null); // Update overall ranks
}

async function updateRanks(subjectId) {
  // Get all entries for this subject, ordered by score (descending)
  const entries = await prisma.leaderboard.findMany({
    where: { subjectId },
    orderBy: { score: 'desc' },
  });

  // Update ranks in a transaction
  const updates = entries.map((entry, index) => 
    prisma.leaderboard.update({
      where: { id: entry.id },
      data: { rank: index + 1 },
    })
  );

  await prisma.$transaction(updates);
}
