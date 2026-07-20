import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get email from query params or use session email
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email') || session.user.email;

        // Fetch user data from database
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                class: true,
                phone: true,
                emailVerified: true,
                createdAt: true,
                lastLogin: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, phone, image, currentPassword, newPassword } = body;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData = {};

        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (image) updateData.image = image;

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                class: true,
                phone: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Perform sequential deletion inside a Prisma transaction to ensure integrity
        await prisma.$transaction([
            // 1. Delete certificates first (references attemptId/userId)
            prisma.certificate.deleteMany({ where: { userId } }),
            // 2. Delete attempts
            prisma.testAttempt.deleteMany({ where: { userId } }),
            // 3. Delete user test analytics
            prisma.userTestAnalytics.deleteMany({ where: { userId } }),
            // 4. Delete learning progress
            prisma.learningProgress.deleteMany({ where: { userId } }),
            // 5. Delete study sessions
            prisma.studySession.deleteMany({ where: { userId } }),
            // 6. Delete analytics events
            prisma.analyticsEvent.deleteMany({ where: { userId } }),
            // 7. Delete payments
            prisma.payment.deleteMany({ where: { userId } }),
            // 8. Delete discussions
            prisma.discussion.deleteMany({ where: { userId } }),
            // 9. Delete olympiad registrations
            prisma.olympiadRegistration.deleteMany({ where: { userId } }),
            // 10. Delete user badges
            prisma.userBadge.deleteMany({ where: { userId } }),
            // 11. Delete DPP configs, assignments, progress
            prisma.dPPConfig.deleteMany({ where: { userId } }),
            prisma.dPPAssignment.deleteMany({ where: { userId } }),
            prisma.dPPProgress.deleteMany({ where: { userId } }),
            // 12. Delete content comments
            prisma.contentComment.deleteMany({ where: { userId } }),
            // 13. Delete content items created by user (safeguard)
            prisma.contentItem.deleteMany({ where: { createdBy: userId } }),
            // 14. Finally delete the User itself (which cascades to Account, Session, VerificationToken, AIDoubtSession, Notification, XPHistory, LeaderboardEntry, UserChallenge, TestAccess)
            prisma.user.delete({ where: { id: userId } }),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
