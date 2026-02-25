import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { olympiadId } = body;

        if (!olympiadId) {
            return NextResponse.json({ success: false, error: 'Olympiad ID is required' }, { status: 400 });
        }

        // Check if olympiad exists
        const olympiad = await prisma.olympiad.findUnique({
            where: { id: olympiadId },
        });

        if (!olympiad) {
            return NextResponse.json({ success: false, error: 'Olympiad not found' }, { status: 404 });
        }

        // Check if already registered
        const existingRegistration = await prisma.olympiadRegistration.findUnique({
            where: {
                userId_olympiadId: {
                    userId: session.user.id,
                    olympiadId: olympiadId,
                },
            },
        });

        if (existingRegistration) {
            return NextResponse.json({
                success: true,
                message: 'Already registered',
                data: existingRegistration
            });
        }

        // Create registration
        const registration = await prisma.olympiadRegistration.create({
            data: {
                userId: session.user.id,
                olympiadId: olympiadId,
                status: 'registered',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully registered for ' + olympiad.name,
            data: registration
        });
    } catch (error) {
        console.error('Error registering for olympiad:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
