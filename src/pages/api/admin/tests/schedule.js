import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  // Only allow admin access
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { testId, startTime, endTime, isPublished = false } = req.body;

      if (!testId || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Convert to Date objects
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      if (startDate >= endDate) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      // Check for scheduling conflicts
      const conflictingTests = await prisma.testSchedule.findMany({
        where: {
          testId: testId,
          OR: [
            {
              startTime: { lte: endDate },
              endTime: { gte: startDate },
            },
          ],
          id: { not: req.body.id || '' }, // Exclude current test if updating
        },
      });

      if (conflictingTests.length > 0) {
        return res.status(400).json({
          error: 'Scheduling conflict with existing test',
          conflicts: conflictingTests,
        });
      }

      // Create or update the schedule
      const schedule = await prisma.testSchedule.upsert({
        where: {
          id: req.body.id || '',
        },
        update: {
          startTime: startDate,
          endTime: endDate,
          isPublished,
        },
        create: {
          testId,
          startTime: startDate,
          endTime: endDate,
          isPublished,
          createdBy: session.user.id,
        },
      });

      return res.status(200).json(schedule);
    } catch (error) {
      console.error('Error scheduling test:', error);
      return res.status(500).json({
        error: 'Failed to schedule test',
        details: error.message,
      });
    }
  } else if (req.method === 'GET') {
    // List scheduled tests with pagination and filtering
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const where = {};
      const now = new Date();
      
      if (status === 'upcoming') {
        where.startTime = { gt: now };
      } else if (status === 'ongoing') {
        where.startTime = { lte: now };
        where.endTime = { gte: now };
      } else if (status === 'completed') {
        where.endTime = { lt: now };
      }
      
      const [schedules, total] = await Promise.all([
        prisma.testSchedule.findMany({
          where,
          include: {
            test: {
              select: {
                title: true,
                durationMinutes: true,
                isPaid: true,
                price: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.testSchedule.count({ where }),
      ]);
      
      return res.status(200).json({
        data: schedules,
        pagination: {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching scheduled tests:', error);
      return res.status(500).json({
        error: 'Failed to fetch scheduled tests',
        details: error.message,
      });
    }
  } else if (req.method === 'DELETE') {
    // Delete a scheduled test
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Schedule ID is required' });
      }
      
      await prisma.testSchedule.delete({
        where: { id },
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting scheduled test:', error);
      return res.status(500).json({
        error: 'Failed to delete scheduled test',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
