import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete all DB sessions for this user (in case they exist)
        await prisma.session.deleteMany({
            where: { userId }
        });

        return NextResponse.json({
            success: true,
            message: 'Signed out of all other sessions successfully'
        });
    } catch (error) {
        console.error('Error signing out of all sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
