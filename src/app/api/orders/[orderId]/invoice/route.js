import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { createPdfInvoice } from '@/lib/pdf-invoice';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view this invoice' },
        { status: 401 }
      );
    }

    const { orderId } = params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    // Apply rate limiting
    const identifier = session.user.id;
    await limiter.check(10, identifier); // 10 requests per minute

    // Get the order with related data
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        userId: session.user.id, // Ensure the order belongs to the user
      },
      include: {
        items: {
          include: {
            test: {
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
        billingAddress: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if invoice can be generated
    if (!['completed', 'processing', 'cancelled', 'refunded'].includes(order.status)) {
      return NextResponse.json(
        { 
          error: `Invoice not available for orders with status: ${order.status}`,
          code: 'INVOICE_NOT_AVAILABLE',
        },
        { status: 400 }
      );
    }

    // Format data for PDF generation
    const invoiceData = {
      invoiceNumber: order.orderNumber,
      orderDate: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      
      customer: {
        name: order.billingAddress?.name || order.user?.name || 'Customer',
        email: order.billingAddress?.email || order.user?.email || '',
        address: {
          line1: order.billingAddress?.line1 || '',
          line2: order.billingAddress?.line2 || '',
          city: order.billingAddress?.city || '',
          state: order.billingAddress?.state || '',
          postalCode: order.billingAddress?.postalCode || '',
          country: order.billingAddress?.country || '',
        },
      },
      
      items: order.items.map(item => ({
        id: item.testId,
        name: item.test?.title || 'Test',
        description: item.test?.description || '',
        quantity: item.quantity,
        unitPrice: item.price / 100, // Convert from paise to rupees
        total: item.total / 100, // Convert from paise to rupees
      })),
      
      subtotal: order.subtotal / 100, // Convert from paise to rupees
      discount: order.discount / 100, // Convert from paise to rupees
      tax: order.tax / 100, // Convert from paise to rupees
      total: order.total / 100, // Convert from paise to rupees
      
      company: {
        name: 'Mindora',
        address: '123 Test Street, Bangalore, Karnataka 560001',
        email: 'billing@mindora.com',
        phone: '+91 9876543210',
        gstin: '29ABCDE1234F1Z2',
        pan: 'ABCDE1234F',
      },
      
      terms: 'Thank you for your business. Please make payment within 15 days of receiving this invoice.',
      notes: 'This is a computer-generated invoice and does not require a physical signature.',
    };

    // Generate PDF invoice
    const pdfBuffer = await createPdfInvoice(invoiceData);

    // Set response headers for PDF
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    
    if (download) {
      headers.set('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="invoice-${order.orderNumber}.pdf"`);
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    
    if (error.message.includes('rate limit exceeded')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate invoice',
        details: error.message,
        code: 'INVOICE_GENERATION_FAILED',
      },
      { status: 500 }
    );
  }
}

// Helper function to create PDF invoice (placeholder implementation)
async function createPdfInvoice(data) {
  // In a real app, use a PDF generation library like pdfkit, puppeteer, or a service
  // This is a simplified example that returns a basic PDF
  
  // Simulate PDF generation delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, you would generate the actual PDF here
  // For now, we'll return a simple PDF with the invoice data
  const { PDFDocument, rgb } = require('pdf-lib');
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points (72 dpi)
  
  const { width, height } = page.getSize();
  const margin = 50;
  
  // Add content to the PDF
  const fontSize = 12;
  let y = height - margin;
  
  // Header
  page.drawText('INVOICE', {
    x: margin,
    y,
    size: 24,
    color: rgb(0, 0, 0),
  });
  
  y -= 40;
  
  // Invoice details
  page.drawText(`Invoice #: ${data.invoiceNumber}`, {
    x: margin,
    y,
    size: fontSize,
  });
  
  page.drawText(`Date: ${new Date(data.orderDate).toLocaleDateString()}`, {
    x: width / 2,
    y,
    size: fontSize,
  });
  
  y -= 20;
  
  // Customer details
  page.drawText('Bill To:', {
    x: margin,
    y,
    size: fontSize,
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  y -= 20;
  
  page.drawText(data.customer.name, {
    x: margin,
    y,
    size: fontSize,
  });
  
  y -= 15;
  
  if (data.customer.address.line1) {
    page.drawText(data.customer.address.line1, {
      x: margin,
      y,
      size: fontSize,
    });
    y -= 15;
  }
  
  if (data.customer.address.line2) {
    page.drawText(data.customer.address.line2, {
      x: margin,
      y,
      size: fontSize,
    });
    y -= 15;
  }
  
  // Items table
  y -= 30;
  
  // Table header
  page.drawText('Description', {
    x: margin,
    y,
    size: fontSize,
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  page.drawText('Qty', {
    x: width - 200,
    y,
    size: fontSize,
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  page.drawText('Price', {
    x: width - 150,
    y,
    size: fontSize,
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  page.drawText('Total', {
    x: width - 100,
    y,
    size: fontSize,
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  y -= 20;
  
  // Table rows
  for (const item of data.items) {
    page.drawText(item.name, {
      x: margin,
      y,
      size: fontSize,
    });
    
    page.drawText(item.quantity.toString(), {
      x: width - 200,
      y,
      size: fontSize,
    });
    
    page.drawText(`₹${item.unitPrice.toFixed(2)}`, {
      x: width - 150,
      y,
      size: fontSize,
    });
    
    page.drawText(`₹${item.total.toFixed(2)}`, {
      x: width - 100,
      y,
      size: fontSize,
    });
    
    y -= 20;
    
    // Handle page breaks
    if (y < 100) {
      page = pdfDoc.addPage([595, 842]);
      y = height - margin;
    }
  }
  
  // Totals
  y -= 20;
  
  page.drawText(`Subtotal: ₹${data.subtotal.toFixed(2)}`, {
    x: width - 200,
    y,
    size: fontSize,
  });
  
  y -= 20;
  
  if (data.discount > 0) {
    page.drawText(`Discount: -₹${data.discount.toFixed(2)}`, {
      x: width - 200,
      y,
      size: fontSize,
    });
    
    y -= 20;
  }
  
  page.drawText(`Tax (18%): ₹${data.tax.toFixed(2)}`, {
    x: width - 200,
    y,
    size: fontSize,
  });
  
  y -= 20;
  
  page.drawText(`Total: ₹${data.total.toFixed(2)}`, {
    x: width - 200,
    y,
    size: fontSize,
    font: await pdfDoc.embedFont('Helvetica-Bold'),
  });
  
  // Footer
  y -= 40;
  
  page.drawText('Thank you for your business!', {
    x: margin,
    y,
    size: fontSize,
  });
  
  // Return the PDF as a buffer
  return await pdfDoc.save();
}
