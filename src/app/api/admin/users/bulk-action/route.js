import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { userIds, action } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: 'No user IDs provided' },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case 'activate':
                // For our app, activate means setting emailVerified if it's null
                result = await prisma.user.updateMany({
                    where: {
                        id: { in: userIds },
                        emailVerified: null,
                    },
                    data: {
                        emailVerified: new Date(),
                    },
                });
                break;

            case 'deactivate':
                // Deactivate means clearing emailVerified
                result = await prisma.user.updateMany({
                    where: {
                        id: { in: userIds },
                    },
                    data: {
                        emailVerified: null,
                    },
                });
                break;

            case 'delete':
                // Delete users (except self)
                const filteredIds = userIds.filter(id => id !== session.user.id);

                if (filteredIds.length === 0) {
                    return NextResponse.json(
                        { error: 'Cannot delete yourself' },
                        { status: 400 }
                    );
                }

                // We should ideally delete related records too, but updateMany/deleteMany doesn't support joins easily in Prisma
                // For a true cleanup, we'd loop or use a transaction with multiple deleteManys

                await prisma.$transaction([
                    prisma.testAttempt.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.payment.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.contentComment.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.userBadge.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.user.deleteMany({ where: { id: { in: filteredIds } } }),
                ]);

                result = { count: filteredIds.length };
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully performed ${action} on ${result.count} users`
        });

    } catch (error) {
        console.error('Bulk action error:', error);
        return NextResponse.json(
            { error: 'Failed to perform bulk action' },
            { status: 500 }
        );
    }
}
