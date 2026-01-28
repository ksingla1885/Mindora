
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        await prisma.olympiadUpdate.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting olympiad update:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
