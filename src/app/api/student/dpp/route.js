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

        const { dpp, assignments, dpps } = await getTodaysDPP(userId, true);

        if (!dpps || dpps.length === 0) {
            return NextResponse.json({
                date: new Date().toISOString(),
                subject: { name: "No Practice" },
                class: session.user.class || "General",
                questions: [],
                message: "No practice problems available for today.",
                dpps: []
            });
        }

        // Return the list of DPPs
        return NextResponse.json({
            dpps: dpps,
            // For backward compatibility (optional but good)
            ...dpps[0]
        });
    } catch (error) {
        console.error('Error in student DPP API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
