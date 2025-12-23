import { NextResponse } from 'next/server';
import { testPrisma, setupTestDatabase, createTestOrder, cleanupTestDatabase } from '../utils/test-utils';
import { GET, POST } from '@/app/api/orders/route';
import { GET as getOrder, PATCH } from '@/app/api/orders/[orderId]/route';
import { POST as cancelOrder } from '@/app/api/orders/[orderId]/cancel/route';
import { GET as getInvoice } from '@/app/api/orders/[orderId]/invoice/route';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      check: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe('Orders API', () => {
  let testUser;
  let testOrder;

  beforeAll(async () => {
    await setupTestDatabase();
    testUser = await testPrisma.user.findUnique({ where: { email: 'test@example.com' } });
    testOrder = await createTestOrder({ userId: testUser.id });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/orders', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce(null);

      const response = await GET(new Request('http://localhost'));
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('You must be signed in to view orders');
    });

    it('should return user orders', async () => {
      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      const response = await GET(new Request('http://localhost'));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.orders)).toBe(true);
      expect(data.orders.length).toBeGreaterThan(0);
      expect(data.orders[0].id).toBe(testOrder.id);
    });

    it('should filter orders by status', async () => {
      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      // Create a completed order
      const completedOrder = await createTestOrder({
        userId: testUser.id,
        status: 'completed',
      });

      // Filter by completed status
      const response = await GET(
        new Request('http://localhost?status=completed')
      );
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.orders.every(order => order.status === 'completed')).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      const testItems = [
        {
          testId: 'test-1',
          quantity: 1,
        },
        {
          testId: 'test-2',
          quantity: 2,
        },
      ];

      const requestBody = {
        items: testItems,
        paymentMethod: 'online',
        billingAddress: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '9876543210',
          line1: '123 Test St',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      };

      // Mock request with JSON body
      const request = {
        json: async () => requestBody,
      };

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.order).toBeDefined();
      expect(data.order.items.length).toBe(2);
      expect(data.order.status).toBe('pending');
      expect(data.order.paymentStatus).toBe('pending');
    });
  });

  describe('GET /api/orders/[orderId]', () => {
    it('should return order details', async () => {
      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      const response = await getOrder(
        { params: { orderId: testOrder.id } },
        { params: { orderId: testOrder.id } }
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.order.id).toBe(testOrder.id);
      expect(data.order.items).toBeDefined();
    });
  });

  describe('PATCH /api/orders/[orderId]', () => {
    it('should update order status', async () => {
      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      const updateData = {
        status: 'processing',
        paymentStatus: 'paid',
        paymentId: 'pay_test123',
      };

      // Mock request with JSON body
      const request = {
        json: async () => updateData,
      };

      const response = await PATCH(
        request,
        { params: { orderId: testOrder.id } }
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.order.status).toBe('processing');
      expect(data.order.paymentStatus).toBe('paid');
    });
  });

  describe('POST /api/orders/[orderId]/cancel', () => {
    it('should cancel an order', async () => {
      // Create a new order to cancel
      const orderToCancel = await createTestOrder({
        userId: testUser.id,
        status: 'pending',
      });

      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      // Mock confirm dialog
      global.confirm = jest.fn(() => true);

      const response = await cancelOrder(
        {},
        { params: { orderId: orderToCancel.id } }
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe('Order cancelled successfully');
      expect(['cancelled', 'refunded']).toContain(data.order.status);
    });
  });

  describe('GET /api/orders/[orderId]/invoice', () => {
    it('should generate an invoice', async () => {
      // Mock authenticated session
      require('next-auth/next').getServerSession.mockResolvedValueOnce({
        user: { id: testUser.id },
      });

      // Mock PDF generation
      jest.mock('@/lib/pdf-invoice', () => ({
        createPdfInvoice: jest.fn().mockResolvedValue(Buffer.from('PDF_CONTENT')),
      }));

      const response = await getInvoice(
        { url: `http://localhost/api/orders/${testOrder.id}/invoice` },
        { params: { orderId: testOrder.id } }
      );
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
    });
  });
});
