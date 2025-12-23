import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/tests/[testId]/attempts/[attemptId]/submit - Submit a test attempt
export async function POST(request, { params }) {
  const { testId, attemptId } = params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get the attempt with test and questions
    const attempt = await prisma.testAttempt.findUnique({
      where: { 
        id: attemptId,
        testId,
        userId: session.user.id,
        finishedAt: null, // Only allow submitting if not already submitted
      },
      include: {
        test: {
          include: {
            questions: {
              include: {
                question: true
              },
              orderBy: {
                sequence: 'asc'
              }
            }
          }
        },
        answers: true
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found or already submitted' },
        { status: 404 }
      );
    }

    // Check if test time has expired
    const now = new Date();
    const endTime = new Date(attempt.startedAt);
    endTime.setMinutes(endTime.getMinutes() + attempt.test.durationMinutes);
    
    if (now > endTime) {
      return NextResponse.json(
        { success: false, error: 'Test time has expired' },
        { status: 400 }
      );
    }

    // Calculate score
    let score = 0;
    let totalMarks = 0;
    const results = [];
    
    // Group answers by question ID for easier lookup
    const answerMap = new Map();
    attempt.answers.forEach(answer => {
      answerMap.set(answer.questionId, answer);
    });

    // Check each question in the test
    for (const testQuestion of attempt.test.questions) {
      const answer = answerMap.get(testQuestion.questionId);
      const question = testQuestion.question;
      let isCorrect = false;
      let marksObtained = 0;
      
      // Only grade if answer exists
      if (answer) {
        switch (question.type) {
          case 'MCQ':
          case 'TRUE_FALSE':
            isCorrect = answer.answer === question.correctAnswer;
            break;
          case 'SHORT_ANSWER':
            // For short answers, we might need manual grading
            isCorrect = false; // Default to false for manual review
            break;
          case 'ESSAY':
            // Essays always need manual grading
            isCorrect = false;
            break;
        }
        
        // Calculate marks (you might want to adjust this based on your grading scheme)
        marksObtained = isCorrect ? testQuestion.marks : 0;
      }
      
      score += marksObtained;
      totalMarks += testQuestion.marks;
      
      results.push({
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: answer?.answer || null,
        isCorrect,
        marks: testQuestion.marks,
        marksObtained,
      });
    }
    
    // Calculate percentage
    const percentage = Math.round((score / totalMarks) * 100);
    const isPassed = percentage >= attempt.test.passingPercentage;
    
    // Update the attempt with results
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        finishedAt: new Date(),
        score: percentage,
        isPassed,
        details: {
          results,
          totalMarks,
          score,
          percentage,
          passingPercentage: attempt.test.passingPercentage,
          isPassed,
        },
      },
      include: {
        test: {
          select: {
            title: true,
            passingPercentage: true,
          },
        },
      },
    });

    // Update user's points or achievements if needed
    if (isPassed) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: { increment: 10 }, // Award points for passing
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        attemptId: updatedAttempt.id,
        testTitle: updatedAttempt.test.title,
        score: updatedAttempt.score,
        isPassed: updatedAttempt.isPassed,
        finishedAt: updatedAttempt.finishedAt,
      },
    });
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit test attempt' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
