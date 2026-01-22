import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET /api/tests/[testId]/attempts/[attemptId] - Get attempt details
export async function GET(request, { params }) {
  const { testId, attemptId } = params;
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
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/tests/[testId]/attempts/[attemptId] - Save or submit test attempt
export async function PATCH(request, { params }) {
  const { testId, attemptId } = params;
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { answers, submit = false } = await request.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid answers format' },
        { status: 400 }
      );
    }

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

    // Check if already submitted
    if (attempt.finishedAt) {
      return NextResponse.json(
        { success: false, error: 'Test already submitted' },
        { status: 400 }
      );
    }

    // Check time limit
    const now = new Date();
    const timeElapsed = Math.floor((now - attempt.startedAt) / 1000 / 60); // in minutes
    const timeRemaining = attempt.test.durationMinutes - timeElapsed;

    if (timeRemaining <= 0) {
      // Auto-submit if time is up
      return handleTestSubmission(attemptId, attempt.details, true);
    }

    // Update answers without submitting
    const updatedDetails = { ...attempt.details };
    let hasChanges = false;

    // Update answers for each question
    for (const [questionId, answer] of Object.entries(answers)) {
      const questionIndex = updatedDetails.questions.findIndex(
        (q) => q.questionId === questionId
      );

      if (questionIndex !== -1) {
        // Only update if answer has changed
        if (JSON.stringify(updatedDetails.questions[questionIndex].answer) !== JSON.stringify(answer)) {
          updatedDetails.questions[questionIndex].answer = answer;
          hasChanges = true;
        }
      }
    }

    // Only update if there are changes
    if (hasChanges) {
      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          details: updatedDetails,
          // Auto-save timestamp (not the final submission)
          updatedAt: now,
        },
      });
    }

    // If not submitting, return success with time remaining
    if (!submit) {
      return NextResponse.json({
        success: true,
        message: 'Answers saved successfully',
        timeRemaining,
        autoSaved: hasChanges,
      });
    }

    // Handle test submission
    return handleTestSubmission(attemptId, updatedDetails, false);
  } catch (error) {
    console.error('Error saving test attempt:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: submit
          ? 'Failed to submit test attempt'
          : 'Failed to save test attempt'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
