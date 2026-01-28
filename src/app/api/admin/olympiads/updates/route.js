
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const updates = await prisma.olympiadUpdate.findMany({
            orderBy: {
                date: 'desc',
            },
            include: {
                olympiad: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(updates);
    } catch (error) {
        console.error('Error fetching olympiad updates:', error);
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
        const { title, content, type, olympiadId, documentUrl } = body;

        if (!title || !type) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const update = await prisma.olympiadUpdate.create({
            data: {
                title,
                content: content || '',
                type,
                documentUrl,
                olympiadId: olympiadId || null,
                date: new Date(),
            },
        });

        return NextResponse.json(update);
    } catch (error) {
        console.error('Error creating olympiad update:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
