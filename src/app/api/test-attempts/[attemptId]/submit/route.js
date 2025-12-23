import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
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

  try {
    const { attemptId } = params;
    const { answers } = await request.json();

    // Get the test attempt with test and questions
    const attempt = await prisma.testAttempt.findUnique({
      where: { 
        id: attemptId,
        userId: session.user.id,
        submittedAt: null,
        finishedAt: null,
      },
      include: {
        test: {
          include: {
            testQuestions: {
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
        { error: 'Test attempt not found or already submitted' },
        { status: 404 }
      );
    }

    const now = new Date();
    const test = attempt.test;
    const testQuestions = test.testQuestions;
    
    // Calculate score if answers are provided
    let score = 0;
    let maxScore = 0;
    const results = {};

    testQuestions.forEach((tq) => {
      const question = tq.question;
      const userAnswer = answers ? answers[question.id] : (attempt.answers?.[question.id] || null);
      const isCorrect = userAnswer && question.correctAnswer 
        ? userAnswer === question.correctAnswer
        : null;
      
      maxScore += tq.marks;
      
      if (isCorrect) {
        score += tq.marks;
      }
      
      results[question.id] = {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        marks: isCorrect ? tq.marks : 0,
        maxMarks: tq.marks,
      };
    });

    // Update the attempt with submission data
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        answers: answers || attempt.answers,
        results,
        score,
        maxScore,
        status: 'submitted',
        submittedAt: now,
        finishedAt: now,
        updatedAt: now,
      },
    });

    // Record learning progress
    await prisma.learningProgress.upsert({
      where: {
        userId_testId: {
          userId: session.user.id,
          testId: test.id,
        },
      },
      update: {
        progress: 100,
        status: 'completed',
        score,
        completedAt: now,
      },
      create: {
        userId: session.user.id,
        testId: test.id,
        progress: 100,
        status: 'completed',
        score,
        completedAt: now,
      },
    });

    // Record study session
    await prisma.studySession.create({
      data: {
        userId: session.user.id,
        testId: test.id,
        startTime: attempt.startedAt,
        endTime: now,
        duration: Math.floor((now - attempt.startedAt) / 1000), // in seconds
        activityType: 'test_completed',
        metadata: {
          score,
          maxScore,
          percentage: Math.round((score / maxScore) * 100),
        },
      },
    });

    return NextResponse.json({
      success: true,
      attempt: {
        id: updatedAttempt.id,
        status: updatedAttempt.status,
        score: updatedAttempt.score,
        maxScore: updatedAttempt.maxScore,
        submittedAt: updatedAttempt.submittedAt,
        test: {
          id: test.id,
          title: test.title,
        },
      },
    });
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit test attempt' },
      { status: 500 }
    );
  }
}
