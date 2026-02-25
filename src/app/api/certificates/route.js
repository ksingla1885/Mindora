import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/certificates
 * Returns all certificates for the current user.
 * It checks the Certificate model first, and falls back to deriving from passed test attempts if needed.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 1. Fetch from Certificate model
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            title: true,
            subject: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    // 2. Derive from passed test attempts that don't have a certificate record yet
    const certificateAttemptIds = certificates.map(c => c.testAttemptId);

    const passedAttempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        isPassed: true,
        status: 'submitted',
        id: { notIn: certificateAttemptIds }
      },
      include: {
        test: {
          select: {
            title: true,
            subject: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Combine them
    const combinedCerts = [
      ...certificates.map(c => ({
        id: c.id,
        testId: c.testId,
        testTitle: c.test?.title || 'Test',
        score: null, // Could be fetched from attempt if needed
        issuedAt: c.issuedAt,
        certificateId: `MIN-${c.id.substring(0, 8).toUpperCase()}`,
        pdfUrl: c.pdfUrl,
        type: 'OFFICIAL'
      })),
      ...passedAttempts.map(a => ({
        id: a.id,
        testId: a.testId,
        testTitle: a.test?.title || 'Test',
        score: a.score,
        issuedAt: a.submittedAt,
        certificateId: `MIN-${a.id.substring(0, 8).toUpperCase()}`,
        pdfUrl: null,
        type: 'DERIVED'
      }))
    ];

    return NextResponse.json({
      success: true,
      certificates: combinedCerts
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}
