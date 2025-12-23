import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateCertificatePDF } from '@/lib/certificateGenerator';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { certificateId } = params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get certificate details
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
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
    });
    
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to download this certificate
    if (session.user.role !== 'ADMIN' && session.user.id !== certificate.userId) {
      return NextResponse.json(
        { error: 'Not authorized to download this certificate' },
        { status: 403 }
      );
    }
    
    // Generate the PDF
    const certificateData = {
      studentName: certificate.user?.name || 'Student',
      courseName: certificate.test?.title || 'Course',
      score: certificate.score,
      issueDate: certificate.issuedAt,
      certificateId: certificate.id,
    };
    
    const pdfBytes = await generateCertificatePDF(certificateData);
    
    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
