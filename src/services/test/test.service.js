import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new test with questions
 * @param {Object} testData - Test data
 * @param {string} userId - User ID of the test creator
 * @returns {Promise<Object>} Created test with questions
 */
export const createTestWithQuestions = async (testData, userId) => {
  const {
    title,
    description = '',
    subject,
    duration,
    passingScore,
    isPublic = false,
    questions = [],
  } = testData;

  return prisma.$transaction(async (tx) => {
    // Create test
    const test = await tx.test.create({
      data: {
        title,
        description,
        durationMinutes: duration,
        passingScore,
        isPublished: isPublic,
        createdBy: userId,
      },
    });

    // Create questions with options
    const createdQuestions = await Promise.all(
      questions.map(async (question, index) => {
        const { options = [], ...questionData } = question;
        
        return tx.question.create({
          data: {
            ...questionData,
            testId: test.id,
            order: index + 1,
            options: {
              create: options.map((option, optionIndex) => ({
                text: option,
                isCorrect: question.correctAnswer === option,
                order: optionIndex + 1,
              })),
            },
          },
          include: {
            options: true,
          },
        });
      })
    );

    return {
      ...test,
      questions: createdQuestions,
    };
  });
};

/**
 * Update a test and its questions
 * @param {string} testId - Test ID
 * @param {Object} testData - Updated test data
 * @param {string} userId - User ID of the editor
 * @returns {Promise<Object>} Updated test with questions
 */
export const updateTestWithQuestions = async (testId, testData, userId) => {
  const {
    title,
    description,
    subject,
    duration,
    passingScore,
    isPublic,
    questions = [],
  } = testData;

  return prisma.$transaction(async (tx) => {
    // Verify test exists and user has permission
    const existingTest = await tx.test.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      throw new Error('Test not found');
    }

    if (existingTest.createdBy !== userId) {
      throw new Error('Unauthorized to update this test');
    }

    // Update test
    const updatedTest = await tx.test.update({
      where: { id: testId },
      data: {
        title,
        description,
        durationMinutes: duration,
        passingScore,
        isPublished: isPublic,
      },
    });

    // Delete existing questions and options
    await tx.option.deleteMany({
      where: { question: { testId } },
    });
    await tx.question.deleteMany({
      where: { testId },
    });

    // Create updated questions with options
    const updatedQuestions = await Promise.all(
      questions.map(async (question, index) => {
        const { options = [], ...questionData } = question;
        
        return tx.question.create({
          data: {
            ...questionData,
            testId,
            order: index + 1,
            options: {
              create: options.map((option, optionIndex) => ({
                text: option,
                isCorrect: question.correctAnswer === option,
                order: optionIndex + 1,
              })),
            },
          },
          include: {
            options: true,
          },
        });
      })
    );

    return {
      ...updatedTest,
      questions: updatedQuestions,
    };
  });
};

/**
 * Get test with questions by ID
 * @param {string} testId - Test ID
 * @returns {Promise<Object>} Test with questions and options
 */
export const getTestWithQuestions = async (testId) => {
  return prisma.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
};

/**
 * Delete a test and its related data
 * @param {string} testId - Test ID
 * @param {string} userId - User ID of the requester
 * @returns {Promise<void>}
 */
export const deleteTest = async (testId, userId) => {
  return prisma.$transaction(async (tx) => {
    // Verify test exists and user has permission
    const test = await tx.test.findUnique({
      where: { id: testId },
      select: { createdBy: true },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    if (test.createdBy !== userId) {
      throw new Error('Unauthorized to delete this test');
    }

    // Delete related data
    await tx.option.deleteMany({
      where: { question: { testId } },
    });
    await tx.question.deleteMany({
      where: { testId },
    });
    await tx.test.delete({
      where: { id: testId },
    });
  });
};

/**
 * List tests with pagination and filtering
 * @param {Object} options - Query options
 * @param {string} options.userId - Filter by creator
 * @param {boolean} options.isPublished - Filter by published status
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} Paginated test list
 */
export const listTests = async ({ 
  userId, 
  isPublished, 
  page = 1, 
  limit = 10 
} = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  
  if (userId) where.createdBy = userId;
  if (isPublished !== undefined) where.isPublished = isPublished;

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    }),
    prisma.test.count({ where }),
  ]);

  return {
    data: tests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
