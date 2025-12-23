import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  const { assignmentId } = params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { answer } = await request.json();

    if (answer === undefined) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      );
    }

    // Get the assignment with the question
    const assignment = await prisma.dPPAssignment.findUnique({
      where: { id: parseInt(assignmentId) },
      include: {
        question: true,
        user: {
          select: {
            id: true,
            dppCurrentStreak: true,
            dppMaxStreak: true,
            dppLastCompletedAt: true,
            classLevel: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (assignment.completedAt) {
      return NextResponse.json(
        { error: 'This DPP has already been completed' },
        { status: 400 }
      );
    }

    // Check if answer is correct
    const isCorrect = checkAnswer(assignment.question, answer);
    const now = new Date();
    const timeSpent = Math.floor((now - assignment.createdAt) / 1000); // in seconds

    // Start a transaction to update multiple records
    const [updatedAssignment] = await prisma.$transaction([
      // Update the assignment
      prisma.dPPAssignment.update({
        where: { id: assignment.id },
        data: {
          answer,
          isCorrect,
          completedAt: now,
          timeSpent,
          updatedAt: now
        },
        include: {
          question: {
            include: {
              topic: true,
              subject: true
            }
          }
        }
      }),
      
      // Update user's DPP streak
      prisma.user.update({
        where: { id: session.user.id },
        data: await calculateStreakData(assignment.user, now)
      }),
      
      // Record the attempt
      prisma.userQuestionAttempt.create({
        data: {
          userId: session.user.id,
          questionId: assignment.questionId,
          isCorrect,
          timeSpent,
          userAnswer: JSON.stringify(answer),
          topicId: assignment.question.topicId,
          subjectId: assignment.question.subjectId,
          classLevel: assignment.user.classLevel
        }
      })
    ]);

    // Prepare response with explanation
    const response = {
      id: updatedAssignment.id,
      isCorrect,
      correctAnswer: updatedAssignment.question.correctAnswer,
      explanation: updatedAssignment.question.explanation,
      timeSpent,
      completedAt: updatedAssignment.completedAt,
      question: {
        id: updatedAssignment.question.id,
        text: updatedAssignment.question.text,
        type: updatedAssignment.question.type,
        difficulty: updatedAssignment.question.difficulty,
        subject: updatedAssignment.question.subject,
        topic: updatedAssignment.question.topic
      },
      // Include streak information
      streak: {
        current: assignment.user.dppCurrentStreak + (isCorrect ? 1 : 0),
        isNewRecord: assignment.user.dppCurrentStreak + 1 > assignment.user.dppMaxStreak
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error submitting DPP answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to check if the answer is correct
function checkAnswer(question, userAnswer) {
  if (question.type === 'MCQ') {
    return question.correctAnswer === userAnswer;
  } else if (question.type === 'MULTIPLE_CORRECT') {
    const correctAnswers = JSON.parse(question.correctAnswer);
    return JSON.stringify(correctAnswers.sort()) === JSON.stringify(userAnswer.sort());
  } else if (question.type === 'TRUE_FALSE') {
    return question.correctAnswer === userAnswer.toString();
  } else {
    // For subjective/descriptive answers, we'll consider it correct for now
    // In a real app, you might want to implement more sophisticated checking
    return true;
  }
}

// Helper function to calculate streak data
async function calculateStreakData(user, now) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const lastCompleted = user.dppLastCompletedAt 
    ? new Date(user.dppLastCompletedAt) 
    : null;

  let currentStreak = user.dppCurrentStreak;
  let maxStreak = user.dppMaxStreak;

  // If last completed was yesterday, increment streak
  // If last completed was today, don't change streak
  // Otherwise, reset streak to 1
  if (lastCompleted) {
    const lastCompletedDate = new Date(lastCompleted);
    lastCompletedDate.setHours(0, 0, 0, 0);
    
    if (lastCompletedDate.getTime() === yesterday.getTime()) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (lastCompletedDate.getTime() < yesterday.getTime()) {
      currentStreak = 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    }
  } else {
    // First time completing a DPP
    currentStreak = 1;
    maxStreak = 1;
  }

  return {
    dppCurrentStreak: currentStreak,
    dppMaxStreak: maxStreak,
    dppLastCompletedAt: now
  };
}
