import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/tests/[testId]/attempts/[attemptId] - Get attempt details
export async function GET(request, { params }) {
  const { testId, attemptId } = await params;
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        testId,
        userId: session.user.id,
      },
      include: {
        test: {
          select: {
            title: true,
            durationMinutes: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Calculate time remaining if test is in progress
    let timeRemaining = null;
    if (!attempt.finishedAt) {
      const now = new Date();
      const timeElapsed = Math.floor((now - attempt.startedAt) / 1000 / 60); // in minutes
      timeRemaining = Math.max(0, attempt.test.durationMinutes - timeElapsed);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...attempt,
        timeRemaining,
      },
    });
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test attempt' },
      { status: 500 }
    );
  }
}

// PATCH /api/tests/[testId]/attempts/[attemptId] - Save or auto-submit test attempt
export async function PATCH(request, { params }) {
  const { testId, attemptId } = await params;
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { answers, timeSpentSeconds, currentQuestionIndex, submit = false } = body;

    // Get the attempt
    const attempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        testId,
        userId: session.user.id,
      },
      include: {
        test: {
          select: {
            durationMinutes: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (attempt.finishedAt || attempt.status === 'submitted') {
      return NextResponse.json(
        { success: false, error: 'Test already submitted' },
        { status: 400 }
      );
    }

    // Update attempt data
    const updatedData = {
      updatedAt: new Date(),
    };

    if (answers && typeof answers === 'object') {
      updatedData.answers = answers;

      // Also update the details field for backward compatibility
      const updatedDetails = { ...(attempt.details || {}) };
      if (updatedDetails.questions) {
        updatedDetails.questions = updatedDetails.questions.map(q => {
          if (answers[q.questionId] !== undefined) {
            return { ...q, answer: answers[q.questionId] };
          }
          return q;
        });
      }
      updatedData.details = updatedDetails;
    }

    if (timeSpentSeconds !== undefined) {
      updatedData.timeSpentSeconds = parseInt(timeSpentSeconds);
    }

    // You could also store currentQuestionIndex in metadata if needed
    if (currentQuestionIndex !== undefined) {
      updatedData.details = {
        ...(updatedData.details || attempt.details || {}),
        currentQuestionIndex: parseInt(currentQuestionIndex)
      };
    }

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: updatedData,
    });

    // Calculate time remaining
    const startTime = new Date(attempt.startedAt).getTime();
    const durationMs = (attempt.test.durationMinutes || 0) * 60 * 1000;
    const elapsedMs = Date.now() - startTime;
    const timeRemaining = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    return NextResponse.json({
      success: true,
      message: 'Progress saved',
      data: {
        ...updatedAttempt,
        timeRemaining
      },
    });

  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to handle test submission and grading
async function handleTestSubmission(attemptId, attemptDetails, isAutoSubmit = false) {
  const now = new Date();
  let score = 0;
  let correctAnswers = 0;
  let totalQuestions = attemptDetails.questions.length;

  // Grade each question
  const gradedQuestions = await Promise.all(
    attemptDetails.questions.map(async (question) => {
      // Get the correct answer from the database
      const questionData = await prisma.question.findUnique({
        where: { id: question.questionId },
        select: {
          correctAnswer: true,
          type: true,
          marks: true,
        },
      });

      let isCorrect = false;
      let marksObtained = 0;

      // Only grade if there's an answer
      if (question.answer !== null && question.answer !== '') {
        // Simple grading - can be enhanced for different question types
        if (question.type === 'mcq') {
          isCorrect = question.answer === questionData.correctAnswer;
        } else if (question.type === 'short_answer' || question.type === 'long_answer') {
          // For subjective answers, mark as not graded (requires manual review)
          isCorrect = false;
        }

        // Calculate marks
        marksObtained = isCorrect ? (question.marks || 1) : 0;
        score += marksObtained;
        if (isCorrect) correctAnswers++;
      }

      return {
        ...question,
        isCorrect,
        marksObtained,
        correctAnswer: questionData.correctAnswer,
      };
    })
  );

  // Calculate percentage
  const totalMarks = gradedQuestions.reduce(
    (sum, q) => sum + (q.marks || 1),
    0
  );
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

  // Update the attempt with results
  const updatedAttempt = await prisma.testAttempt.update({
    where: { id: attemptId },
    data: {
      finishedAt: now,
      score: percentage, // Store as percentage
      details: {
        ...attemptDetails,
        questions: gradedQuestions,
        totalMarks,
        score,
        percentage: parseFloat(percentage.toFixed(2)),
        correctAnswers,
        totalQuestions,
        submittedAt: now.toISOString(),
        isAutoSubmit,
      },
    },
    include: {
      test: {
        select: {
          title: true,
        },
      },
    },
  });

  // TODO: Trigger any post-submission actions (notifications, analytics, etc.)

  return NextResponse.json({
    success: true,
    message: isAutoSubmit ? 'Test auto-submitted (time expired)' : 'Test submitted successfully',
    data: {
      ...updatedAttempt,
      timeRemaining: 0,
    },
  });
}
