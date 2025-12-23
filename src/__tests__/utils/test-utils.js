import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Create a test database connection
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '_test',
    },
  },
});

// Mock user data for testing
const mockUsers = [
  {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'USER',
  },
  {
    id: 'test-admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN',
  },
];

// Mock test data
const mockTests = [
  {
    id: 'test-1',
    title: 'Basic Math Test',
    description: 'Test your basic math skills',
    price: 9900, // ₹99.00
    duration: 30, // minutes
    difficulty: 'beginner',
    isPublished: true,
  },
  {
    id: 'test-2',
    title: 'Advanced Math Test',
    description: 'Advanced mathematics challenge',
    price: 19900, // ₹199.00
    duration: 60, // minutes
    difficulty: 'advanced',
    isPublished: true,
  },
];

// Mock order data
const createMockOrder = (overrides = {}) => ({
  id: `order-${uuidv4()}`,
  orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  userId: mockUsers[0].id,
  status: 'pending',
  paymentStatus: 'pending',
  subtotal: 9900,
  discount: 0,
  tax: 1782, // 18% of subtotal
  total: 11682, // subtotal + tax - discount
  paymentMethod: 'online',
  paymentId: `pay_${uuidv4()}`,
  ...overrides,
});

// Mock order item data
const createMockOrderItem = (orderId, testId, overrides = {}) => ({
  id: `item-${uuidv4()}`,
  orderId,
  testId,
  quantity: 1,
  price: 9900,
  total: 9900,
  ...overrides,
});

// Mock order update data
const createMockOrderUpdate = (orderId, status, overrides = {}) => ({
  id: `update-${uuidv4()}`,
  orderId,
  status,
  message: `Order status updated to ${status}`,
  timestamp: new Date(),
  ...overrides,
});

// Helper functions for tests
const setupTestDatabase = async () => {
  // Truncate all tables
  const modelNames = Object.keys(testPrisma).filter(
    (key) => !key.startsWith('_') && !key.startsWith('$')
  );

  for (const model of modelNames) {
    try {
      await testPrisma[model].deleteMany({});
    } catch (error) {
      console.error(`Error cleaning up table ${model}:`, error);
    }
  }

  // Seed test data
  await testPrisma.user.createMany({
    data: mockUsers.map(user => ({
      ...user,
      emailVerified: new Date(),
    })),
  });

  await testPrisma.test.createMany({
    data: mockTests,
  });
};

const createTestOrder = async (overrides = {}) => {
  const orderData = createMockOrder(overrides);
  const order = await testPrisma.order.create({
    data: {
      ...orderData,
      items: {
        create: [
          createMockOrderItem(orderData.id, mockTests[0].id),
        ],
      },
      updates: {
        create: [
          createMockOrderUpdate(orderData.id, orderData.status, {
            message: 'Order created',
          }),
        ],
      },
    },
    include: {
      items: true,
      updates: true,
    },
  });
  return order;
};

const cleanupTestDatabase = async () => {
  await testPrisma.$disconnect();
};

export {
  testPrisma,
  mockUsers,
  mockTests,
  createMockOrder,
  createMockOrderItem,
  createMockOrderUpdate,
  setupTestDatabase,
  createTestOrder,
  cleanupTestDatabase,
};
