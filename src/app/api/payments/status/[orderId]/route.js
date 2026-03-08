import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/payments/status/[orderId]
 * Fetch payment details by providerOrderId (Razorpay Order ID)
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = params;
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payment = await prisma.payment.findFirst({
            where: {
                providerOrderId: orderId,
                userId: session.user.id,
            },
            include: {
                test: {
                    select: {
                        title: true,
                        description: true,
                        price: true,
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: payment.id,
                orderId: payment.providerOrderId,
                paymentId: payment.providerPaymentId,
                amount: payment.amount,
                status: payment.status,
                createdAt: payment.createdAt,
                test: payment.test,
            }
        });
    } catch (error) {
        console.error('Error fetching payment status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
