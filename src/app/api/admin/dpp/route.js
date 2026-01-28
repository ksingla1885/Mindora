
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classFilter = searchParams.get('class');
        const subjectId = searchParams.get('subjectId');

        const where = {};
        if (classFilter && classFilter !== 'all') where.class = classFilter;
        if (subjectId && subjectId !== 'all') where.subjectId = subjectId;

        const dpps = await prisma.dailyPracticeProblem.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
            include: {
                subject: true,
                _count: {
                    select: { questions: true },
                },
            },
        });

        return NextResponse.json(dpps);
    } catch (error) {
        console.error('Error fetching DPPs:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { date, class: className, subjectId, questions } = body;

        if (!date || !className || !subjectId || !questions || !Array.isArray(questions)) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // 1. Create the DPP record
        const dpp = await prisma.dailyPracticeProblem.create({
            data: {
                date: new Date(date),
                class: className,
                subjectId,
                title: `DPP for ${new Date(date).toLocaleDateString()}`,
                isActive: true,
            },
        });

        // 2. Process questions
        // Since we need to create questions and link them, we'll do this in a loop or transaction
        // Assuming questions are NEW questions specific to this DPP for now, or we reusing?
        // User said "upload these", implying new content.
        // We need to fetch the TOPIC. Since we might not have a topic selected, 
        // we'll look for a "General" topic for this subject or create one if it matches the subject name.

        // Find the subject to get a default topic
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: { topics: true },
        });

        if (!subject) {
            return new NextResponse('Subject not found', { status: 404 });
        }

        let defaultTopicId;
        if (subject.topics.length > 0) {
            defaultTopicId = subject.topics[0].id;
        } else {
            // Create a default topic if none exists
            const newTopic = await prisma.topic.create({
                data: {
                    subjectId: subject.id,
                    name: 'General DPP Questions',
                    difficulty: 'medium',
                },
            });
            defaultTopicId = newTopic.id;
        }

        const createdQuestions = [];

        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            let order = 1;
            for (const q of questions) {
                const typeMapping = {
                    'MCQ': 'mcq',
                    'TRUE_FALSE': 'true_false', // or treat as mcq? Let's use specific type if schema supports or generic string
                    'SHORT_ANSWER': 'short_answer'
                };

                const dbType = typeMapping[q.type] || 'mcq';

                // Create the question
                const newQuestion = await tx.question.create({
                    data: {
                        text: q.text,
                        type: dbType,
                        options: q.options || undefined, // Store options only if present
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        difficulty: 'medium',
                        marks: 4,
                        topicId: defaultTopicId,
                    },
                });

                // Link to DPP
                await tx.dPPQuestion.create({
                    data: {
                        dppId: dpp.id,
                        questionId: newQuestion.id,
                        order: order++,
                    },
                });

                createdQuestions.push(newQuestion);
            }
        });

        return NextResponse.json({ dpp, count: createdQuestions.length });
    } catch (error) {
        console.error('Error creating DPP:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
