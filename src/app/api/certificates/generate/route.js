import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper function to generate PDF
async function generateCertificatePDF(certificateData) {
  const { studentName, courseName, score, issueDate, certificateId } = certificateData;
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([800, 600]);
  
  // Set up fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Draw background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 2,
  });
  
  // Add certificate border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: 760,
    height: 560,
    borderColor: rgb(0.8, 0.6, 0.1),
    borderWidth: 2,
  });
  
  // Add header
  page.drawText('CERTIFICATE OF ACHIEVEMENT', {
    x: 400,
    y: 500,
    size: 24,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
    align: 'center',
  });
  
  // Add student name
  page.drawText('This certificate is awarded to', {
    x: 400,
    y: 450,
    size: 16,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
    align: 'center',
  });
  
  page.drawText(studentName, {
    x: 400,
    y: 400,
    size: 32,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
    align: 'center',
  });
  
  // Add course details
  page.drawText(`has successfully completed the course:`, {
    x: 400,
    y: 350,
    size: 16,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
    align: 'center',
  });
  
  page.drawText(`"${courseName}"`, {
    x: 400,
    y: 320,
    size: 20,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
    align: 'center',
  });
  
  if (score) {
    page.drawText(`with a score of ${score}%`, {
      x: 400,
      y: 280,
      size: 16,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
      align: 'center',
    });
  }
  
  // Add issue date
  page.drawText(`Issued on: ${format(new Date(issueDate), 'MMMM d, yyyy')}`, {
    x: 100,
    y: 180,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Add certificate ID
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 100,
    y: 160,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Add signature line
  page.drawLine({
    start: { x: 600, y: 150 },
    end: { x: 780, y: 150 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Mindora Academy', {
    x: 650,
    y: 130,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Add watermark
  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText('MINDORA ACADEMY', {
      x: 200,
      y: 300,
      size: 64,
      font: boldFont,
      color: rgb(0.95, 0.95, 0.95),
      rotate: Math.PI / 4,
      opacity: 0.1,
    });
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { testId, userId } = await request.json();
    
    if (!testId || !userId) {
      return NextResponse.json(
        { error: 'Test ID and User ID are required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission to generate this certificate
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to generate this certificate' },
        { status: 403 }
      );
    }
    
    // Get test and user data
    const [test, user, existingCertificate] = await Promise.all([
      prisma.test.findUnique({
        where: { id: testId },
        include: {
          attempts: {
            where: { userId, status: 'COMPLETED' },
            orderBy: { score: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.certificate.findFirst({
        where: {
          testId,
          userId,
        },
      }),
    ]);
    
    if (!test || !user) {
      return NextResponse.json(
        { error: 'Test or user not found' },
        { status: 404 }
      );
    }
    
    // Check if user has completed the test
    const bestAttempt = test.attempts[0];
    if (!bestAttempt) {
      return NextResponse.json(
        { error: 'User has not completed this test' },
        { status: 400 }
      );
    }
    
    // Use existing certificate or create a new one
    let certificate = existingCertificate;
    
    if (!certificate) {
      // Create certificate record in database
      certificate = await prisma.certificate.create({
        data: {
          id: `cert_${uuidv4()}`,
          userId,
          testId,
          score: bestAttempt.score,
          issuedAt: new Date(),
          metadata: {
            testTitle: test.title,
            userName: user.name,
          },
        },
      });
    }
    
    // Generate PDF
    const certificateData = {
      studentName: user.name,
      courseName: test.title,
      score: bestAttempt.score,
      issueDate: certificate.issuedAt,
      certificateId: certificate.id,
    };
    
    const pdfBytes = await generateCertificatePDF(certificateData);
    
    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.id}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
