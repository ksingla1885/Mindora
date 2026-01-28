
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        const dpp = await prisma.dailyPracticeProblem.findUnique({
            where: { id },
            include: {
                subject: true,
                questions: {
                    include: {
                        question: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        if (!dpp) {
            return new NextResponse('DPP not found', { status: 404 });
        }

        return NextResponse.json(dpp);
    } catch (error) {
        console.error('Error fetching DPP:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { date, class: className, subjectId, questions } = body;

        if (!date || !className || !subjectId || !questions || !Array.isArray(questions)) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Transaction: Update DPP metadata, clear old questions, add new ones
        await prisma.$transaction(async (tx) => {
            // 1. Update DPP Record
            await tx.dailyPracticeProblem.update({
                where: { id },
                data: {
                    date: new Date(date),
                    class: className,
                    subjectId,
                    title: `DPP for ${new Date(date).toLocaleDateString()}`,
                },
            });

            // 2. Clear existing questions (Remove the links)
            // Note: We are not deleting the Question records themselves to avoid losing data if used elsewhere, 
            // though in this exact app flow they are likely unique to this DPP. 
            // For cleaner DB, we COULD delete them if they are not used elsewhere, but safe bet is just unlink.
            await tx.dPPQuestion.deleteMany({
                where: { dppId: id },
            });

            // 3. Create and Link New Questions
            // Find default topic again in case subject changed
            const subject = await tx.subject.findUnique({
                where: { id: subjectId },
                include: { topics: true },
            });

            let defaultTopicId;
            if (subject && subject.topics.length > 0) {
                defaultTopicId = subject.topics[0].id;
            } else if (subject) {
                const newTopic = await tx.topic.create({
                    data: {
                        subjectId: subject.id,
                        name: 'General DPP Questions',
                        difficulty: 'medium',
                    },
                });
                defaultTopicId = newTopic.id;
            }

            let order = 1;
            for (const q of questions) {
                const typeMapping = {
                    'MCQ': 'mcq',
                    'TRUE_FALSE': 'true_false',
                    'SHORT_ANSWER': 'short_answer'
                };
                const dbType = typeMapping[q.type] || 'mcq';

                const newQuestion = await tx.question.create({
                    data: {
                        text: q.text,
                        type: dbType,
                        options: q.options || undefined,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        difficulty: 'medium',
                        marks: 4,
                        topicId: defaultTopicId, // Use topic of the (potentially new) subject
                    },
                });

                await tx.dPPQuestion.create({
                    data: {
                        dppId: id,
                        questionId: newQuestion.id,
                        order: order++,
                    },
                });
            }
        });

        return NextResponse.json({ message: 'DPP updated successfully' });
    } catch (error) {
        console.error('Error updating DPP:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        await prisma.dPPQuestion.deleteMany({
            where: { dppId: id },
        });

        await prisma.dailyPracticeProblem.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting DPP:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
