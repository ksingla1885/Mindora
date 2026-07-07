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

export async function DELETE(request) {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { paymentIds } = await request.json();

        if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid or empty paymentIds list.' },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            // Unlink paymentId from TestAttempt
            await tx.testAttempt.updateMany({
                where: {
                    paymentId: { in: paymentIds }
                },
                data: {
                    paymentId: null
                }
            });

            // Revoke TestAccess by deleting the records associated with these paymentIds
            await tx.testAccess.deleteMany({
                where: {
                    paymentId: { in: paymentIds }
                }
            });

            // Delete the payments
            await tx.payment.deleteMany({
                where: {
                    id: { in: paymentIds }
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${paymentIds.length} payment(s).`
        });

    } catch (error) {
        console.error('Error deleting payments:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete payments.' },
            { status: 500 }
        );
    }
}
