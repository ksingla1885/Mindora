import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';

// Background color for the certificate
const BG_COLOR = { r: 1, g: 1, b: 0.95 }; // Light cream
const BORDER_COLOR = { r: 0.8, g: 0.6, b: 0.1 }; // Gold
const TEXT_COLOR = { r: 0.2, g: 0.2, b: 0.2 }; // Dark gray
const SECONDARY_COLOR = { r: 0.4, g: 0.4, b: 0.4 }; // Gray
const ACCENT_COLOR = { r: 0, g: 0.4, b: 0.8 }; // Blue

export async function generateCertificatePDF(certificateData) {
  const { 
    studentName, 
    courseName, 
    score, 
    issueDate, 
    certificateId 
  } = certificateData;
  
  // Create a new PDF document with a larger page size
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1000, 700]); // Wider page for better layout
  
  // Get the width and height of the page
  const { width, height } = page.getSize();
  
  // Set up fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  
  // Draw background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(BG_COLOR.r, BG_COLOR.g, BG_COLOR.b),
  });
  
  // Add decorative border
  const borderMargin = 40;
  page.drawRectangle({
    x: borderMargin,
    y: borderMargin,
    width: width - (borderMargin * 2),
    height: height - (borderMargin * 2),
    borderColor: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
    borderWidth: 2,
  });
  
  // Add decorative corner elements
  const cornerSize = 60;
  const cornerThickness = 2;
  const cornerLength = 20;
  
  // Top-left corner
  page.drawLine({
    start: { x: borderMargin, y: height - borderMargin - cornerSize },
    end: { x: borderMargin + cornerLength, y: height - borderMargin - cornerSize },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  page.drawLine({
    start: { x: borderMargin, y: height - borderMargin },
    end: { x: borderMargin, y: height - borderMargin - cornerLength },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  // Top-right corner
  page.drawLine({
    start: { x: width - borderMargin, y: height - borderMargin - cornerSize },
    end: { x: width - borderMargin - cornerLength, y: height - borderMargin - cornerSize },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  page.drawLine({
    start: { x: width - borderMargin, y: height - borderMargin },
    end: { x: width - borderMargin, y: height - borderMargin - cornerLength },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  // Bottom-left corner
  page.drawLine({
    start: { x: borderMargin, y: borderMargin + cornerSize },
    end: { x: borderMargin + cornerLength, y: borderMargin + cornerSize },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  page.drawLine({
    start: { x: borderMargin, y: borderMargin },
    end: { x: borderMargin, y: borderMargin + cornerLength },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  // Bottom-right corner
  page.drawLine({
    start: { x: width - borderMargin, y: borderMargin + cornerSize },
    end: { x: width - borderMargin - cornerLength, y: borderMargin + cornerSize },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  page.drawLine({
    start: { x: width - borderMargin, y: borderMargin },
    end: { x: width - borderMargin, y: borderMargin + cornerLength },
    thickness: cornerThickness,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  // Add header
  const headerText = 'CERTIFICATE OF ACHIEVEMENT';
  const headerFontSize = 28;
  const headerWidth = font.widthOfTextAtSize(headerText, headerFontSize);
  
  page.drawText(headerText, {
    x: (width - headerWidth) / 2,
    y: height - 120,
    size: headerFontSize,
    font: titleFont,
    color: rgb(BORDER_COLOR.r * 0.8, BORDER_COLOR.g * 0.8, BORDER_COLOR.b * 0.8),
  });
  
  // Add decorative line under header
  page.drawLine({
    start: { x: width * 0.2, y: height - 150 },
    end: { x: width * 0.8, y: height - 150 },
    thickness: 1,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  // Add "This is to certify that" text
  const certifyText = 'This is to certify that';
  const certifyFontSize = 16;
  const certifyWidth = font.widthOfTextAtSize(certifyText, certifyFontSize);
  
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: height - 220,
    size: certifyFontSize,
    font: font,
    color: rgb(SECONDARY_COLOR.r, SECONDARY_COLOR.g, SECONDARY_COLOR.b),
  });
  
  // Add student name
  const nameFontSize = 42;
  const nameWidth = boldFont.widthOfTextAtSize(studentName, nameFontSize);
  
  page.drawText(studentName, {
    x: (width - nameWidth) / 2,
    y: height - 300,
    size: nameFontSize,
    font: boldFont,
    color: rgb(TEXT_COLOR.r, TEXT_COLOR.g, TEXT_COLOR.b),
  });
  
  // Add decorative line under name
  page.drawLine({
    start: { x: width * 0.3, y: height - 320 },
    end: { x: width * 0.7, y: height - 320 },
    thickness: 1,
    color: rgb(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b),
  });
  
  // Add course completion text
  const completionText = `has successfully completed the course`;
  const completionFontSize = 16;
  const completionWidth = font.widthOfTextAtSize(completionText, completionFontSize);
  
  page.drawText(completionText, {
    x: (width - completionWidth) / 2,
    y: height - 380,
    size: completionFontSize,
    font: font,
    color: rgb(SECONDARY_COLOR.r, SECONDARY_COLOR.g, SECONDARY_COLOR.b),
  });
  
  // Add course name
  const courseFontSize = 24;
  const courseWidth = boldFont.widthOfTextAtSize(courseName, courseFontSize);
  
  page.drawText(`"${courseName}"`, {
    x: (width - courseWidth) / 2,
    y: height - 420,
    size: courseFontSize,
    font: boldFont,
    color: rgb(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
  });
  
  // Add score if available
  if (score !== undefined) {
    const scoreText = `with a score of ${score}%`;
    const scoreFontSize = 16;
    const scoreWidth = font.widthOfTextAtSize(scoreText, scoreFontSize);
    
    page.drawText(scoreText, {
      x: (width - scoreWidth) / 2,
      y: height - 460,
      size: scoreFontSize,
      font: font,
      color: rgb(SECONDARY_COLOR.r, SECONDARY_COLOR.g, SECONDARY_COLOR.b),
    });
  }
  
  // Add issue date
  const formattedDate = format(new Date(issueDate), 'MMMM d, yyyy');
  const dateText = `Issued on: ${formattedDate}`;
  const dateFontSize = 12;
  
  page.drawText(dateText, {
    x: 100,
    y: 100,
    size: dateFontSize,
    font: font,
    color: rgb(SECONDARY_COLOR.r, SECONDARY_COLOR.g, SECONDARY_COLOR.b),
  });
  
  // Add certificate ID
  const idText = `Certificate ID: ${certificateId}`;
  const idFontSize = 10;
  
  page.drawText(idText, {
    x: 100,
    y: 80,
    size: idFontSize,
    font: font,
    color: rgb(SECONDARY_COLOR.r, SECONDARY_COLOR.g, SECONDARY_COLOR.b),
  });
  
  // Add signature line
  const signatureY = 150;
  
  page.drawLine({
    start: { x: width - 250, y: signatureY },
    end: { x: width - 100, y: signatureY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Mindora Academy', {
    x: width - 225,
    y: signatureY - 20,
    size: 14,
    font: boldFont,
    color: rgb(TEXT_COLOR.r, TEXT_COLOR.g, TEXT_COLOR.b),
  });
  
  // Add watermark
  const watermarkText = 'MINDORA ACADEMY';
  const watermarkFontSize = 72;
  const watermarkWidth = boldFont.widthOfTextAtSize(watermarkText, watermarkFontSize);
  
  page.drawText(watermarkText, {
    x: (width - watermarkWidth) / 2,
    y: height / 2,
    size: watermarkFontSize,
    font: boldFont,
    color: rgb(0.9, 0.9, 0.9),
    rotate: Math.PI / 4,
    opacity: 0.1,
  });
  
  // Add small print at the bottom
  const smallPrint = 'This certificate is issued by Mindora Academy and can be verified through our official website.';
  const smallPrintFontSize = 8;
  const smallPrintWidth = font.widthOfTextAtSize(smallPrint, smallPrintFontSize);
  
  page.drawText(smallPrint, {
    x: (width - smallPrintWidth) / 2,
    y: 40,
    size: smallPrintFontSize,
    font: font,
    color: rgb(SECONDARY_COLOR.r, SECONDARY_COLOR.g, SECONDARY_COLOR.b),
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
