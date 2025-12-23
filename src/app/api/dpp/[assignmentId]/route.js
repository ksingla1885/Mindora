import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/dpp/[assignmentId] - Get DPP assignment details
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { assignmentId } = params;

        const assignment = await prisma.dPPAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                question: {
                    include: {
                        topic: {
                            include: {
                                subject: true
                            }
                        }
                    }
                },
                dpp: true
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

        // Format for TestTaker
        // TestTaker expects a list of questions.
        // Since this is a single assignment, it's one question.
        // But if the DPP has multiple questions, maybe we should return all for that DPP?
        // The user clicked "Start Practice" on a specific assignment in the UI.
        // However, usually DPP is a set.
        // In `dpp/page.jsx`, it iterates over assignments.
        // If `dppData.today` is a single assignment, then we are solving one by one.

        // Let's return the single question formatted as a list
        const questions = [{
            id: assignment.question.id,
            question: assignment.question.question,
            type: assignment.question.type,
            options: assignment.question.options,
            marks: assignment.question.marks,
            imageUrl: assignment.question.imageUrl,
            // Add other fields as needed
        }];

        return NextResponse.json({
            id: assignment.id,
            title: `Daily Practice: ${assignment.question.topic.subject.name}`,
            description: assignment.question.topic.name,
            duration: 30, // Default duration
            questions: questions,
            isCompleted: assignment.status === 'COMPLETED',
            userAnswer: assignment.userAnswer,
            status: assignment.status
        });

    } catch (error) {
        console.error('Error fetching DPP assignment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assignment' },
            { status: 500 }
        );
    }
}
