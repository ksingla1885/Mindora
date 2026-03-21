import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { createPdfInvoice } from '@/lib/pdf-invoice';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function GET(request, { params }) {
  try {
    const session = await auth();
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

