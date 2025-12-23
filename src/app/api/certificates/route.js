import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get all certificates for the current user
    const certificates = await prisma.certificate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        test: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });
    
    // Format the response
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      testId: cert.testId,
      testTitle: cert.test?.title || 'Test',
      userId: cert.userId,
      userName: cert.user?.name || 'Student',
      score: cert.score,
      issuedAt: cert.issuedAt,
      metadata: cert.metadata,
    }));
    
    return NextResponse.json(formattedCertificates);
    
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}
