import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { sendTestResultEmail } from '@/lib/email';


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
    const { answers, timeSpentSeconds, currentQuestionIndex, submit = false, violation } = body;

    // Get the attempt (include test proctoring config)
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
            tabMonitoringEnabled: true,
            proctoringEnabled: true,
            faceDetectionEnabled: true,
            maxTabSwitches: true,
            maxViolationsAllowed: true,
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
    const updatedData = {};

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

    // ── Violation handling ────────────────────────────────────────────────
    const existingMetadata = attempt.metadata || {};
    let newViolations = Array.isArray(existingMetadata.violations)
      ? existingMetadata.violations
      : [];

    let shouldDisqualify = false;
    let disqualificationReason = '';

    if (violation && typeof violation === 'object') {
      // De-duplicate: don't append the exact same event twice
      const isDuplicate = newViolations.some(
        (v) => v.type === violation.type && v.timestamp === violation.timestamp
      );
      if (!isDuplicate) {
        newViolations = [...newViolations, violation];
      }

      // Check limits (fall back to safe defaults if fields aren't set on the test)
      const maxTabSwitches =
        attempt.test.maxTabSwitches != null ? attempt.test.maxTabSwitches : 3;
      const maxViolationsAllowed =
        attempt.test.maxViolationsAllowed != null ? attempt.test.maxViolationsAllowed : 5;

      const tabSwitchCount = newViolations.filter(
        (v) => v.type === 'TAB_SWITCH_DETECTED'
      ).length;
      const activeViolationCount = newViolations.filter(
        (v) => v.type !== 'MEDIA_ACCESS_DENIED' && v.type !== 'FULLSCREEN_ERROR' && v.type !== 'TAB_SWITCH_DETECTED'
      ).length;

       const hasCameraDenial = newViolations.some((v) => v.type === 'MEDIA_ACCESS_DENIED');
       if (attempt.test.faceDetectionEnabled && hasCameraDenial) {
         shouldDisqualify = true;
         disqualificationReason = 'Camera access is required for this test. Proctoring session could not be started.';
       } else if (tabSwitchCount >= maxTabSwitches) {
         shouldDisqualify = true;
         disqualificationReason = `Exceeded maximum tab switches limit (${maxTabSwitches}).`;
       } else if (activeViolationCount >= maxViolationsAllowed) {
         shouldDisqualify = true;
         disqualificationReason = `Exceeded maximum proctoring violations limit (${maxViolationsAllowed}).`;
       }

      // Persist updated violation list into metadata
      updatedData.metadata = {
        ...existingMetadata,
        violations: newViolations,
        violationCount: newViolations.length,
        ...(shouldDisqualify ? { disqualified: true, disqualificationReason } : {}),
      };

      if (shouldDisqualify) {
        updatedData.status = 'disqualified';
        updatedData.finishedAt = new Date();
        updatedData.submittedAt = new Date();
      }
    }
    // ─────────────────────────────────────────────────────────────────────

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
      attempt: {
        ...updatedAttempt,
        metadata: updatedAttempt.metadata || {},
      },
      disqualified: shouldDisqualify,
      disqualificationReason: shouldDisqualify ? disqualificationReason : undefined,
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

// POST /api/tests/[testId]/attempts/[attemptId] - Submit a test attempt
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
          if (!isCorrect) {
            let parsedOptions = [];
            try {
              parsedOptions = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
            } catch (e) {
              parsedOptions = [];
            }
            if (Array.isArray(parsedOptions)) {
              const correctOpt = parsedOptions.find(opt => {
                const optId = typeof opt === 'object' ? opt.id : opt;
                const optText = typeof opt === 'object' ? (opt.text || opt.value) : opt;
                return String(optText) === String(question.correctAnswer) || String(optId) === String(question.correctAnswer);
              });
              if (correctOpt && typeof correctOpt === 'object') {
                isCorrect = String(userAnswer) === String(correctOpt.id);
              }
            }
          }
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
          options: true,
        },
      });

      let isCorrect = false;
      let marksObtained = 0;

      // Only grade if there's an answer
      if (question.answer !== null && question.answer !== '') {
        const qType = (question.type || '').toLowerCase();
        if (qType === 'mcq' || qType === 'multiple_choice') {
          isCorrect = String(question.answer) === String(questionData.correctAnswer);
          if (!isCorrect) {
            let parsedOptions = [];
            try {
              parsedOptions = typeof questionData.options === 'string' ? JSON.parse(questionData.options) : questionData.options;
            } catch (e) {
              parsedOptions = [];
            }
            if (Array.isArray(parsedOptions)) {
              const correctOpt = parsedOptions.find(opt => {
                const optId = typeof opt === 'object' ? opt.id : opt;
                const optText = typeof opt === 'object' ? (opt.text || opt.value) : opt;
                return String(optText) === String(questionData.correctAnswer) || String(optId) === String(questionData.correctAnswer);
              });
              if (correctOpt && typeof correctOpt === 'object') {
                isCorrect = String(question.answer) === String(correctOpt.id);
              }
            }
          }
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
