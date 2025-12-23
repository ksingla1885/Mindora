import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken, hashPassword } from '@/lib/tokens';
import { sendPasswordChangedEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_VALIDATION = {
  minLength: { value: PASSWORD_MIN_LENGTH, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
  hasUppercase: { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
  hasLowercase: { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter' },
  hasNumber: { pattern: /[0-9]/, message: 'Password must contain at least one number' },
  hasSpecialChar: { pattern: /[^A-Za-z0-9]/, message: 'Password must contain at least one special character' },
};

function validatePassword(password) {
  const errors = [];
  
  if (password.length < PASSWORD_VALIDATION.minLength.value) {
    errors.push(PASSWORD_VALIDATION.minLength.message);
  }
  
  if (!PASSWORD_VALIDATION.hasUppercase.pattern.test(password)) {
    errors.push(PASSWORD_VALIDATION.hasUppercase.message);
  }
  
  if (!PASSWORD_VALIDATION.hasLowercase.pattern.test(password)) {
    errors.push(PASSWORD_VALIDATION.hasLowercase.message);
  }
  
  if (!PASSWORD_VALIDATION.hasNumber.pattern.test(password)) {
    errors.push(PASSWORD_VALIDATION.hasNumber.message);
  }
  
  if (!PASSWORD_VALIDATION.hasSpecialChar.pattern.test(password)) {
    errors.push(PASSWORD_VALIDATION.hasSpecialChar.message);
  }
  
  return errors;
}
export async function POST(request) {
  let user = null;
  
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Token and password are required' 
        },
        { status: 400 }
      );
    }

    // Verify the password reset token
    user = await verifyToken(token, 'PASSWORD_RESET');

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or expired token. Please request a new password reset link.' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Password does not meet requirements',
          details: passwordErrors 
        },
        { status: 400 }
      );
    }

    // Get current user with password
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    });

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(password, currentUser.password);
    if (isSamePassword) {
      return NextResponse.json(
        { 
          success: false,
          error: 'New password cannot be the same as your current password' 
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);
    const newSessionToken = crypto.randomUUID();

    // Update the user's password and invalidate all sessions in a transaction
    await prisma.$transaction([
      // Update password and increment session version
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
          lastPasswordChange: new Date()
        },
      }),
      
      // Delete all existing sessions
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
      
      // Create audit log
      prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_SUCCESS',
          userId: user.id,
          metadata: {
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString()
          }
        }
      })
    ]);

    // Send password changed notification (non-blocking)
    sendPasswordChangedEmail(user).catch(console.error);

    // Return success response with security headers
    return NextResponse.json(
      { 
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
        redirect: '/auth/login'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'Clear-Site-Data': '"cache", "cookies", "storage"',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Log the error for monitoring (non-blocking)
    if (user?.id) {
      prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_FAILURE',
          userId: user.id,
          metadata: {
            error: error.message,
            ip: request?.headers?.get('x-forwarded-for') || 'unknown',
            userAgent: request?.headers?.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(console.error);
    }

    // Return generic error message to avoid leaking sensitive information
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred while resetting your password. Please try again later.' 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
}
