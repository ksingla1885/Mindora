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

        // Fetch DPPs and user's real streak in parallel
        const [{ dpps }, user] = await Promise.all([
            getTodaysDPP(userId, true),
            prisma.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true },
            }),
        ]);

        const currentStreak = user?.currentStreak ?? 0;

        if (!dpps || dpps.length === 0) {
            return NextResponse.json({
                date: new Date().toISOString(),
                subject: { name: 'No Practice' },
                class: session.user.class || 'General',
                questions: [],
                message: 'No practice problems available for today.',
                dpps: [],
                currentStreak,
            });
        }

        return NextResponse.json({
            dpps,
            currentStreak,
            ...dpps[0],
        });
    } catch (error) {
        console.error('Error in student DPP API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
