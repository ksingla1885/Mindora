import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const where = {
            endDate: {
                gte: new Date(),
            },
        };

        if (category) {
            where.description = {
                contains: category,
                mode: 'insensitive',
            };
        }

        const olympiads = await prisma.olympiad.findMany({
            where,
            include: {
                _count: {
                    select: { registrations: true },
                },
            },
            orderBy: {
                startDate: 'asc',
            },
        });

        // If user is logged in, check their registrations
        let userRegistrations = [];
        if (session?.user?.id) {
            userRegistrations = await prisma.olympiadRegistration.findMany({
                where: {
                    userId: session.user.id,
                },
                select: {
                    olympiadId: true,
                },
            });
        }

        const registrationIds = userRegistrations.map((r) => r.olympiadId);

        const data = olympiads.map((o) => ({
            ...o,
            isRegistered: registrationIds.includes(o.id),
            participantCount: o._count.registrations,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching olympiads:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
