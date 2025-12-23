import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API responses
export const handlers = [
  // Mock payment history endpoint
  rest.get('/api/payments/history', (req, res, ctx) => {
    const status = req.url.searchParams.get('status') || 'all';
    const search = req.url.searchParams.get('search') || '';
    
    const mockPayments = [
      {
        id: 'txn_789012',
        date: '2023-06-15T10:30:00Z',
        description: 'Premium Subscription - Annual',
        amount: 4999,
        discount: 1000,
        currency: 'INR',
        status: 'completed',
        invoiceUrl: '#',
        receiptUrl: '#',
        notes: 'Auto-renewal scheduled for June 15, 2024',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      },
      // Add more mock payments as needed
    ];

    // Filter payments based on status and search query
    let filteredPayments = mockPayments;
    if (status !== 'all') {
      filteredPayments = filteredPayments.filter(payment => payment.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(
        payment =>
          payment.description.toLowerCase().includes(searchLower) ||
          payment.id.toLowerCase().includes(searchLower)
      );
    }

    return res(
      ctx.delay(150),
      ctx.json({
        data: filteredPayments,
        total: filteredPayments.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    );
  }),

  // Mock payment method endpoint
  rest.get('/api/payments/methods', (req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.json({
        data: [
          {
            id: 'card_123',
            type: 'card',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          },
        ],
      })
    );
  }),

  // Mock invoice generation
  rest.post('/api/payments/generate-invoice', (req, res, ctx) => {
    return res(
      ctx.delay(200),
      ctx.json({
        success: true,
        url: '/invoices/invoice_123.pdf',
      })
    );
  }),
];

export const server = setupServer(...handlers);
