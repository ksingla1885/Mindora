import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTodaysDPP } from '@/services/dpp/dpp.service';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get today's assignments including completed ones for the full list view
        const assignments = await getTodaysDPP(userId, true);

        if (!assignments || assignments.length === 0) {
            return NextResponse.json(null);
        }

        // Adapt to the frontend expected format for dpp/page.jsx
        // The frontend expects:
        // {
        //   date: string,
        //   subject: { name: string },
        //   class: string,
        //   questions: [ { question: { text: string, type: string, options: {}, correctAnswer: string, explanation: string } } ]
        // }

        // Fetch the dpp record to get the date (optional, but good for completeness)
        const dppRecord = await prisma.dailyPracticeProblem.findFirst({
            where: { userId, status: { in: ['PENDING', 'COMPLETED'] } },
            orderBy: { date: 'desc' }
        });

        const response = {
            date: dppRecord?.date || new Date().toISOString(),
            subject: { name: assignments[0].question.topic.subject.name },
            class: session.user.classLevel || "General",
            questions: assignments.map(a => ({
                id: a.id, // assignment id
                question: {
                    id: a.question.id,
                    text: a.question.text,
                    type: a.question.type,
                    options: a.question.options,
                    correctAnswer: a.question.correctAnswer,
                    explanation: a.question.explanation
                }
            }))
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in student DPP API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
