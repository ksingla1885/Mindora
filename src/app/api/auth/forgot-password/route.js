import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create password reset token and get user
    const result = await createPasswordResetToken(email);
    
    // Even if user doesn't exist, return success to prevent email enumeration
    if (!result) {
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link' },
        { status: 200 }
      );
    }

    const { token, user } = result;
    
    // Send password reset email
    await sendPasswordResetEmail(user, token);

    return NextResponse.json(
      { message: 'Password reset link sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
