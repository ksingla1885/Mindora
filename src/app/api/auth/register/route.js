import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createOTPToken } from "@/lib/tokens";
import { sendRegisterOTPEmail } from "@/lib/email";

const ALLOWED_ROLES = ['STUDENT', 'TEACHER'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'STUDENT', class: userClass, resendOnly } = body;

    console.log('[Register] Attempting registration for email:', email);

    if (resendOnly) {
      if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });
      
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
      if (user.emailVerified) return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
      
      const otp = await createOTPToken(email, user.id);
      await sendRegisterOTPEmail(user, otp);
      
      return NextResponse.json({ message: 'OTP resent successfully' }, { status: 200 });
    }

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    if (existingUser && !existingUser.emailVerified) {
      // Update unverified user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          password: hashedPassword,
          role,
          class: userClass || null,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          class: userClass || null,
          emailVerified: null, // Keep it null until verified
          profileMeta: {},
        },
      });
    }

    // Generate and store OTP
    const otp = await createOTPToken(email, user.id);

    // Send OTP email
    try {
      await sendRegisterOTPEmail(user, otp);
      console.log('[Register] OTP sent to:', email);
    } catch (emailError) {
      console.error('[Register] Failed to send OTP email:', emailError);
      // We don't fail registration if email fails in dev, but in prod we might
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { message: 'Failed to send verification email. Please try again later.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Registration started. Please check your email for the verification code.',
        email: email,
        userId: user.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Register] Unexpected error:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}
