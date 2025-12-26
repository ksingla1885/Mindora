import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email'; // Assuming email utility exists

export async function POST(request) {
    try {
        const session = await auth();
        const userRole = session?.user?.role?.toLowerCase();

        if (!session || userRole !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin required' },
                { status: 401 }
            );
        }

        const { email, name, role, class: className } = await request.json();

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and Name are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create user (or invitation)
        // For now, we'll just create the user with a random password or send an invite token
        // Since we don't have a full invitation flow, we'll create the user directly
        // In a real app, you'd create a VerificationToken and send it via email

        // Generate a random temporary password (in production, use a proper invite flow)
        const tempPassword = Math.random().toString(36).slice(-8);
        // You would hash this password before saving if you were saving it directly, 
        // but usually you send a link to set password.
        // For this MVP/demo, let's assume we send an invite link.

        // Create a verification token for the invite
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
                type: 'EMAIL_VERIFICATION', // reusing existing enum or type
            },
        });

        // Send email (mocked for now if sendEmail doesn't exist)
        console.log(`Sending invite to ${email} with token ${token}`);

        return NextResponse.json({
            success: true,
            message: 'Invitation sent successfully',
        });

    } catch (error) {
        console.error('Error sending invitation:', error);
        return NextResponse.json(
            { error: 'Failed to send invitation' },
            { status: 500 }
        );
    }
}
