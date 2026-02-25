import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateCertificatePDF } from '@/lib/certificateGenerator';

/**
 * GET /api/certificates/download/[attemptId]
 * Generates and downloads a certificate PDF based on a passed test attempt.
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    const { certificateId } = params; // This is the attemptId in our implementation

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get attempt details (which serves as our certificate source)
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: certificateId },
      include: {
        test: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!attempt || !attempt.isPassed) {
      return NextResponse.json(
        { error: 'Certificate not found or test not passed' },
        { status: 404 }
      );
    }

    // Check if user has permission to download this certificate
    if (session.user.role !== 'ADMIN' && session.user.id !== attempt.userId) {
      return NextResponse.json(
        { error: 'Not authorized to download this certificate' },
        { status: 403 }
      );
    }

    // Generate the PDF
    const certificateData = {
      studentName: attempt.user?.name || 'Student',
      courseName: attempt.test?.title || 'Course',
      score: attempt.score,
      issueDate: attempt.finishedAt || attempt.submittedAt || new Date(),
      certificateId: `MIN-${attempt.id.substring(0, 8).toUpperCase()}`,
    };

    const pdfBytes = await generateCertificatePDF(certificateData);

    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateData.certificateId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json(
      { error: 'Failed to download certificate' },
      { status: 500 }
    );
  }
}
