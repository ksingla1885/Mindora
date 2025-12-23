import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Helper function to check if the answer is correct
function checkAnswer(question, userAnswer) {
    if (!question || !userAnswer) return false;

    const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];

    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'SUBJECTIVE') {
        // For single-answer questions, check if the answer matches exactly
        return correctAnswers.some(ca =>
            userAnswers.some(ua => String(ua).trim().toLowerCase() === String(ca).trim().toLowerCase())
        );
    } else if (question.type === 'MULTIPLE_SELECT') {
        // For multiple-select questions, all correct answers must be selected and no incorrect ones
        if (userAnswers.length !== correctAnswers.length) return false;

        return correctAnswers.every(ca =>
            userAnswers.some(ua => String(ua).trim().toLowerCase() === String(ca).trim().toLowerCase())
        );
    }

    return false;
}

// Helper function to calculate score based on question difficulty and time spent
function calculateScore(question, isCorrect, timeSpent) {
    if (!isCorrect) return 0;

    const baseScores = {
        EASY: 10,
        MEDIUM: 20,
        HARD: 30,
    };

    const baseScore = baseScores[question.difficulty] || 10;
    const timePenalty = Math.min(Math.floor(timeSpent / 30), 5); // Max 5 points penalty for time

    return Math.max(1, baseScore - timePenalty); // Ensure at least 1 point for correct answer
}

// Helper function to award XP or badges for DPP completion
async function awardDPPCompletion(userId, dppId) {
    // In a real app, this would award XP, badges, or other rewards
    console.log(`User ${userId} completed DPP ${dppId}`);

    try {
        // Example: Award XP
        await prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: 50 }, // Award 50 XP for completing a DPP
            },
        });

        // Check for badge achievements
        const completedDPPs = await prisma.dPP.count({
            where: {
                userId,
                completed: true,
            },
        });

        // Example: Award badge for completing 5 DPPs
        if (completedDPPs === 5) {
            await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: 'dpp_5_completed',
                    awardedAt: new Date(),
                },
            });
        }
    } catch (e) {
        console.error('Error awarding DPP completion:', e);
    }
}

// Helper function to update leaderboard
async function updateLeaderboard(userId, score) {
    if (!score || score <= 0) return;

    try {
        // Update the leaderboard entry for the user
        await prisma.leaderboard.upsert({
            where: { userId },
            update: {
                score: { increment: score },
                lastUpdated: new Date(),
            },
            create: {
                userId,
                score,
                lastUpdated: new Date(),
            },
        });
    } catch (e) {
        console.error('Error updating leaderboard:', e);
    }
}

// Helper function to send notifications
async function sendNotification({ userId, type, title, message, metadata = {} }) {
    try {
        console.log(`Notification for user ${userId}: ${title} - ${message}`, metadata);

        // Store the notification in the database
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                read: false,
                metadata,
            },
        });
    } catch (e) {
        console.error('Error sending notification:', e);
    }
}

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = params;
        // TestTaker sends: { answers, timeSpent, flaggedQuestions, ... }
        const { answers, timeSpent: timeSpentMap } = await request.json();

        // Find the DPP assignment
        const assignment = await prisma.dPPAssignment.findUnique({
            where: {
                id,
                userId: session.user.id,
                // We allow resubmission if not completed, or maybe we should check completed?
                // The original logic checked completed: false.
                completed: false,
            },
            include: {
                question: true,
            },
        });

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found or already completed' },
                { status: 404 }
            );
        }

        // Extract answer for this question
        const answer = answers[assignment.questionId];
        // Extract time spent for this question (default to 0 if not found)
        const timeSpent = timeSpentMap[assignment.questionId] || 0;

        // Check if the answer is correct
        const isCorrect = checkAnswer(assignment.question, answer);

        // Calculate score based on time spent and correctness
        const score = calculateScore(assignment.question, isCorrect, timeSpent);

        // Start a transaction to update multiple records atomically
        const [updatedAssignment] = await prisma.$transaction([
            // Update the assignment as completed
            prisma.dPPAssignment.update({
                where: { id },
                data: {
                    completed: true,
                    completedAt: new Date(),
                    timeSpent,
                    score,
                },
                include: {
                    question: true,
                },
            }),

            // Create or update the answer
            prisma.dPPAnswer.upsert({
                where: {
                    assignmentId: id,
                },
                update: {
                    userAnswer: Array.isArray(answer) ? answer : [answer],
                    isCorrect,
                    feedback: isCorrect ? 'Correct answer!' : 'Incorrect answer',
                },
                create: {
                    assignmentId: id,
                    questionId: assignment.questionId,
                    userId: session.user.id,
                    userAnswer: Array.isArray(answer) ? answer : [answer],
                    isCorrect,
                    feedback: isCorrect ? 'Correct answer!' : 'Incorrect answer',
                },
            }),

            // Update user's DPP statistics
            prisma.userDPPStats.upsert({
                where: { userId: session.user.id },
                update: {
                    totalAttempts: { increment: 1 },
                    correctAttempts: isCorrect ? { increment: 1 } : undefined,
                    totalTimeSpent: { increment: timeSpent },
                    lastAttemptedAt: new Date(),
                    currentStreak: isCorrect
                        ? { increment: 1 }
                        : 0, // Reset streak on incorrect answer
                },
                create: {
                    userId: session.user.id,
                    totalAttempts: 1,
                    correctAttempts: isCorrect ? 1 : 0,
                    totalTimeSpent: timeSpent,
                    lastAttemptedAt: new Date(),
                    currentStreak: isCorrect ? 1 : 0,
                    longestStreak: isCorrect ? 1 : 0,
                },
            }),
        ]);

        // If this was the last question in the DPP, update the DPP record
        const pendingAssignments = await prisma.dPPAssignment.count({
            where: {
                dppId: assignment.dppId,
                userId: session.user.id,
                completed: false,
            },
        });

        if (pendingAssignments === 0) {
            await prisma.dPP.update({
                where: { id: assignment.dppId },
                data: {
                    completed: true,
                    completedAt: new Date(),
                },
            });

            // Award XP or badges for completing a DPP
            await awardDPPCompletion(session.user.id, assignment.dppId);
        }

        // Update leaderboard
        await updateLeaderboard(session.user.id, score);

        // Send notification if needed
        if (isCorrect) {
            await sendNotification({
                userId: session.user.id,
                type: 'DPP_QUESTION_CORRECT',
                title: 'Great job!',
                message: `You answered a ${assignment.question.difficulty} question correctly!`,
                metadata: {
                    questionId: assignment.questionId,
                    dppId: assignment.dppId,
                    assignmentId: id,
                },
            });
        }

        // Return format expected by TestTaker
        // TestTaker expects: { score, correctAnswers, totalQuestions, ... }
        return NextResponse.json({
            success: true,
            score: isCorrect ? 100 : 0, // Percentage? Or raw score? TestTaker displays score%.
            // If TestTaker expects percentage, 100 or 0 is fine for single question.
            correctAnswers: isCorrect ? 1 : 0,
            totalQuestions: 1,
            timeSpent: timeSpent,
            rank: 1, // Placeholder
            isCorrect,
            feedback: isCorrect ? 'Correct answer!' : 'Incorrect answer',
            correctAnswer: assignment.question.correctAnswer,
            explanation: assignment.question.explanation,
        });

    } catch (error) {
        console.error('Error submitting DPP answer:', error);
        return NextResponse.json(
            { error: 'Failed to submit answer', details: error.message },
            { status: 500 }
        );
    }
}
