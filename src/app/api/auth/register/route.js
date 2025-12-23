import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const ALLOWED_ROLES = ['STUDENT', 'TEACHER'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'STUDENT', class: userClass } = body;

    console.log('[Register] Attempting registration for email:', email);

    // Validate input
    if (!name || !email || !password) {
      console.log('[Register] Missing required fields');
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!ALLOWED_ROLES.includes(role)) {
      console.log('[Register] Invalid role:', role);
      return NextResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('[Register] Password too short');
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('[Register] Checking for existing user...');
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        console.log('[Register] User already exists');
        return NextResponse.json(
          { message: 'User already exists with this email' },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error('[Register] Database error checking user:', dbError);

      // Check if it's a connection error
      const isConnectionError = dbError.message.includes('Can\'t reach database server') ||
        dbError.message.includes('Connection failed');

      return NextResponse.json(
        {
          message: isConnectionError ? 'Database connection failed. Please check if your database is running.' : 'Database error checking user',
          error: dbError.message
        },
        { status: 500 }
      );
    }

    // Hash password with bcrypt
    console.log('[Register] Hashing password...');
    if (!bcrypt || typeof bcrypt.hash !== 'function') {
      console.error('[Register] Bcrypt is not correctly imported', bcrypt);
      throw new Error('Server configuration error: Bcrypt not available');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log('[Register] Creating user in database...');
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          class: userClass || null,
          emailVerified: new Date(),
          profileMeta: {},
        },
      });


      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      console.log('[Register] User created successfully:', user.id);

      // Send verification email in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implement email verification
        console.log('[Register] Sending verification email to:', email);
      }

      return NextResponse.json(
        {
          user: userWithoutPassword,
          message: 'User registered successfully. Please check your email to verify your account.'
        },
        { status: 201 }
      );
    } catch (createError) {
      console.error('[Register] Database error creating user:', createError);
      return NextResponse.json(
        { message: 'Failed to create user', error: createError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Register] Unexpected error:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
