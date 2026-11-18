import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await auth();

        const userRole = session?.user?.role?.toLowerCase();

        if (!session || userRole !== 'admin') {
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
                result = await prisma.user.updateMany({
                    where: {
                        id: { in: userIds },
                    },
                    data: {
                        emailVerified: new Date(),
                    },
                });
                break;

            case 'deactivate':
                // Deactivate means clearing emailVerified and removing any active verification tokens
                await prisma.verificationToken.deleteMany({
                    where: {
                        userId: { in: userIds },
                    },
                });

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

                // Delete related records in dependency order
                await prisma.$transaction([
                    prisma.certificate.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.testAttempt.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.payment.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.contentComment.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.discussion.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.userBadge.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.leaderboardEntry.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.learningProgress.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.studySession.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.olympiadRegistration.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.dPPAssignment.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.dPPProgress.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.dPPConfig.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.analyticsEvent.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.userChallenge.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.userTestAnalytics.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.xPHistory.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.verificationToken.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.session.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.account.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.notification.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.aIDoubtSession.deleteMany({ where: { userId: { in: filteredIds } } }),
                    prisma.testAccess.deleteMany({ where: { userId: { in: filteredIds } } }),
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
