import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { sendTestResultEmail } from '@/lib/email';

// POST /api/tests/[testId]/attempts/[attemptId]/submit - Submit a test attempt
export async function POST(request, { params }) {
  const { testId, attemptId } = await params;
  console.log(`[API] Submit attempt for testId: ${testId}, attemptId: ${attemptId}`);
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Parse incoming answers from the request body
    const body = await request.json();
    // answers is a map of { questionId: selectedAnswer }
    const submittedAnswers = body.answers || {};
    const timeSpentData = body.timeSpent || {};

    // Get the attempt with test and questions
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        id: attemptId,
        testId,
        userId: session.user.id,
        finishedAt: null, // Only allow submitting if not already submitted
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
        { success: false, error: 'Attempt not found or already submitted' },
        { status: 404 }
      );
    }

    // Check if test time has expired — allow submission slightly after for network latency
    const now = new Date();
    const endTime = new Date(attempt.startedAt);
    endTime.setMinutes(endTime.getMinutes() + attempt.test.durationMinutes + 1); // 1 min grace

    if (now > endTime) {
      return NextResponse.json(
        { success: false, error: 'Test time has expired' },
        { status: 400 }
      );
    }

    // Calculate score from submitted answers
    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const results = [];

    // Grade each question in the test
    for (const testQuestion of attempt.test.testQuestions) {
      const question = testQuestion.question;
      const userAnswer = submittedAnswers[question.id];
      let isCorrect = false;
      let marksObtained = 0;
      const questionMarks = testQuestion.marks || question.marks || 1;

      // Only grade if answer exists
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
        const qType = (question.type || '').toUpperCase();
        if (qType === 'MCQ' || qType === 'MULTIPLE_CHOICE' || qType === 'TRUE_FALSE') {
          isCorrect = String(userAnswer) === String(question.correctAnswer);
        } else if (qType === 'SHORT_ANSWER') {
          // Short answers require manual grading — default to false
          isCorrect = false;
        } else if (qType === 'ESSAY') {
          isCorrect = false;
        }

        marksObtained = isCorrect ? questionMarks : 0;
        if (isCorrect) correctCount++;
        else incorrectCount++;
      } else {
        skippedCount++;
      }

      score += marksObtained;
      totalMarks += questionMarks;

      results.push({
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer ?? null,
        isCorrect,
        marks: questionMarks,
        marksObtained,
        timeSpent: timeSpentData[question.id] || 0,
      });
    }

    // Calculate percentage
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passingScore = attempt.test.passingScore || 33;
    const isPassed = percentage >= passingScore;

    // Time spent in seconds
    const timeSpentSeconds = Math.floor((now - attempt.startedAt) / 1000);

    // Update the attempt with results
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        finishedAt: now,
        submittedAt: now,
        score: percentage,
        isPassed,
        timeSpentSeconds,
        status: 'submitted',
        answers: submittedAnswers, // Store as JSON for easy retrieval in results page
        details: {
          results,
          totalMarks,
          score,
          percentage,
          passingScore,
          isPassed,
          correctCount,
          incorrectCount,
          skippedCount,
          timeSpentSeconds,
          submittedAt: now.toISOString(),
        },
      },
      include: {
        test: {
          select: {
            title: true,
            passingScore: true,
          },
        },
      },
    });

    // Award points for passing
    if (isPassed) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: { increment: 10 },
          xp: { increment: 50 },
        },
      }).catch(err => console.error('Failed to award points:', err));
    }

    // Send email notification (non-blocking)
    sendTestResultEmail(session.user, {
      testId,
      attemptId: updatedAttempt.id,
      testTitle: updatedAttempt.test.title,
      score: updatedAttempt.score,
      percentage,
      correctCount,
      totalQuestions: attempt.test.testQuestions.length,
    }).catch(err => console.error('Failed to send test result email:', err));

    return NextResponse.json({
      success: true,
      data: {
        attemptId: updatedAttempt.id,
        testTitle: updatedAttempt.test.title,
        score: updatedAttempt.score,
        isPassed: updatedAttempt.isPassed,
        finishedAt: updatedAttempt.finishedAt,
        percentage,
        correctCount,
        incorrectCount,
        skippedCount,
        totalQuestions: attempt.test.testQuestions.length,
        totalMarks,
        timeSpentSeconds,
      },
    });
  } catch (error) {
    console.error('Error submitting test attempt:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit test attempt', details: error?.message },
      { status: 500 }
    );
  }
}
