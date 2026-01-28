
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { user } = session;
        console.log("Fetching DPP for user:", user.email, "Class:", user.class);

        // If user has no class assigned, we might return empty or default
        // Assuming user.class is a string like "12", "11"

        if (!user.class) {
            // Fallback or error? For now return null to show "No DPP"
            return NextResponse.json(null);
        }

        // specific to their class, latest date first
        const dpp = await prisma.dailyPracticeProblem.findFirst({
            where: {
                class: user.class,
                isActive: true,
            },
            orderBy: {
                date: 'desc',
            },
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
            // Logic for "No DPP Available"
            return NextResponse.json(null);
        }

        // Transform data to match frontend expectations if needed
        // The frontend expects a "DAILY_PROBLEM" object with specific structure
        // We might need to adapt the frontend or adapt the response here.
        // Let's return the raw DPP data and update the frontend to use it.

        return NextResponse.json(dpp);
    } catch (error) {
        console.error('Error fetching student DPP:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
