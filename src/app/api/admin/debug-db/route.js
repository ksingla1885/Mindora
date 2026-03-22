import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testConnection = await prisma.$queryRaw`SELECT 1`.catch(err => {
      throw new Error(`DB Connection Failed: ${err.message}`);
    });

    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'success',
      connection: 'OK',
      userCount,
      dbUrl: process.env.DATABASE_URL?.split('@')[1] // Hide credentials
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
