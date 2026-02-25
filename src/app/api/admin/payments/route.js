import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where = {};
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (search) {
            where.OR = [
                { providerOrderId: { contains: search, mode: 'insensitive' } },
                { providerPaymentId: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { test: { title: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    }
                },
                test: {
                    select: {
                        title: true,
                        price: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate stats
        const totalRevenue = payments
            .filter(p => p.status === 'CAPTURED')
            .reduce((sum, p) => sum + p.amount, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRevenue = payments
            .filter(p => p.status === 'CAPTURED' && p.createdAt >= today)
            .reduce((sum, p) => sum + p.amount, 0);

        const stats = {
            totalRevenue,
            todayRevenue,
            successfulCount: payments.filter(p => p.status === 'CAPTURED').length,
            failedCount: payments.filter(p => p.status === 'FAILED').length,
            pendingCount: payments.filter(p => p.status === 'CREATED').length,
            totalCount: payments.length,
        };

        return NextResponse.json({
            success: true,
            data: payments,
            stats,
        });
    } catch (error) {
        console.error('Error fetching admin payments:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
