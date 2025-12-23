import { testPrisma, setupTestDatabase, cleanupTestDatabase } from '../utils/test-utils';
import { POST as createOrder } from '@/app/api/orders/route';
import { PATCH as updateOrder } from '@/app/api/orders/[orderId]/route';
import { POST as cancelOrder } from '@/app/api/orders/[orderId]/cancel/route';
import { GET as getOrder } from '@/app/api/orders/[orderId]/route';

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

describe('Order Flow Integration Test', () => {
  let testUser;
  let testItems;

  beforeAll(async () => {
    await setupTestDatabase();
    testUser = await testPrisma.user.findUnique({ where: { email: 'test@example.com' } });
    
    // Get test items
    testItems = await testPrisma.test.findMany({
      take: 2,
      select: {
        id: true,
        title: true,
        price: true,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should complete a full order flow', async () => {
    // Mock authenticated session
    require('next-auth/next').getServerSession.mockImplementation(() => ({
      user: { id: testUser.id },
    }));

    // 1. Create Order
    const orderData = {
      items: testItems.map(item => ({
        testId: item.id,
        quantity: 1,
      })),
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

    const createResponse = await createOrder({
      json: async () => orderData,
    });
    
    expect(createResponse.status).toBe(200);
    const { order: createdOrder } = await createResponse.json();
    
    // 2. Verify Order Creation
    expect(createdOrder).toBeDefined();
    expect(createdOrder.status).toBe('pending');
    expect(createdOrder.paymentStatus).toBe('pending');
    expect(createdOrder.items.length).toBe(testItems.length);

    // 3. Simulate Payment Success
    const updateResponse = await updateOrder(
      {
        json: async () => ({
          status: 'processing',
          paymentStatus: 'paid',
          paymentId: `pay_${Date.now()}`,
        }),
      },
      { params: { orderId: createdOrder.id } }
    );
    
    expect(updateResponse.status).toBe(200);
    const { order: updatedOrder } = await updateResponse.json();
    
    // 4. Verify Order Update
    expect(updatedOrder.status).toBe('processing');
    expect(updatedOrder.paymentStatus).toBe('paid');

    // 5. Complete Order Fulfillment
    const completeResponse = await updateOrder(
      {
        json: async () => ({
          status: 'completed',
        }),
      },
      { params: { orderId: createdOrder.id } }
    );
    
    expect(completeResponse.status).toBe(200);
    const { order: completedOrder } = await completeResponse.json();
    
    // 6. Verify Order Completion
    expect(completedOrder.status).toBe('completed');

    // 7. Verify Test Access
    const userTests = await testPrisma.userTest.findMany({
      where: { userId: testUser.id },
    });
    
    expect(userTests.length).toBe(testItems.length);
    testItems.forEach(test => {
      expect(userTests.some(ut => ut.testId === test.id)).toBe(true);
    });

    // 8. Get Order Details
    const getResponse = await getOrder(
      {},
      { params: { orderId: createdOrder.id } }
    );
    
    expect(getResponse.status).toBe(200);
    const { order: fetchedOrder } = await getResponse.json();
    
    // 9. Verify Order Details
    expect(fetchedOrder.id).toBe(createdOrder.id);
    expect(fetchedOrder.status).toBe('completed');
    expect(fetchedOrder.items.length).toBe(testItems.length);

    // 10. Cancel Order (should fail as it's already completed)
    global.confirm = jest.fn(() => true);
    const cancelResponse = await cancelOrder(
      {},
      { params: { orderId: createdOrder.id } }
    );
    
    expect(cancelResponse.status).toBe(400);
    const cancelData = await cancelResponse.json();
    expect(cancelData.code).toBe('ORDER_CANNOT_BE_CANCELLED');
  });

  it('should handle order cancellation with refund', async () => {
    // Mock authenticated session
    require('next-auth/next').getServerSession.mockImplementation(() => ({
      user: { id: testUser.id },
    }));

    // 1. Create a paid order
    const orderData = {
      items: testItems.map(item => ({
        testId: item.id,
        quantity: 1,
      })),
      paymentMethod: 'online',
      billingAddress: {
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    const createResponse = await createOrder({
      json: async () => orderData,
    });
    
    const { order: testOrder } = await createResponse.json();
    
    // 2. Mark as paid
    await updateOrder(
      {
        json: async () => ({
          status: 'processing',
          paymentStatus: 'paid',
          paymentId: `pay_${Date.now()}`,
        }),
      },
      { params: { orderId: testOrder.id } }
    );

    // 3. Cancel the order
    global.confirm = jest.fn(() => true);
    
    // Mock successful refund
    const mockProcessRefund = jest.fn().mockResolvedValue('completed');
    jest.mock('@/app/api/orders/[orderId]/cancel/route', () => ({
      processRefund: mockProcessRefund,
    }));

    const cancelResponse = await cancelOrder(
      {},
      { params: { orderId: testOrder.id } }
    );
    
    expect(cancelResponse.status).toBe(200);
    const cancelData = await cancelResponse.json();
    
    // 4. Verify cancellation
    expect(['cancelled', 'refunded']).toContain(cancelData.order.status);
    
    // 5. Verify test access was revoked
    const userTests = await testPrisma.userTest.findMany({
      where: { 
        userId: testUser.id,
        testId: { in: testItems.map(t => t.id) },
      },
    });
    
    expect(userTests.length).toBe(0);
  });
});
