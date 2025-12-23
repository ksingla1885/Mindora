import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const configs = await prisma.dPPConfig.findMany({
      include: {
        schedules: {
          include: {
            subject: true
          },
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(configs);

  } catch (error) {
    console.error('Error fetching DPP configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DPP configurations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      name,
      description,
      isActive,
      startDate,
      endDate,
      subjects,
      classLevels,
      schedules
    } = await request.json();

    // Validate required fields
    if (!name || !startDate || !endDate || !classLevels?.length || !schedules?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the DPP config with its schedules in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // First create the config
      const config = await prisma.dPPConfig.create({
        data: {
          name,
          description,
          isActive: isActive !== false, // default to true if not provided
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          subjects: Array.isArray(subjects) ? subjects : [],
          classLevels: Array.isArray(classLevels) ? classLevels : [],
          createdBy: session.user.id
        }
      });

      // Then create the schedules
      const createdSchedules = [];
      for (const schedule of schedules) {
        const created = await prisma.dPPSchedule.create({
          data: {
            dppConfigId: config.id,
            dayOfWeek: schedule.dayOfWeek,
            subjectId: schedule.subjectId,
            classLevel: schedule.classLevel,
            difficulty: schedule.difficulty || 'MEDIUM',
            questionCount: schedule.questionCount || 1,
            topics: Array.isArray(schedule.topics) ? schedule.topics : undefined
          },
          include: {
            subject: true
          }
        });
        createdSchedules.push(created);
      }

      return {
        ...config,
        schedules: createdSchedules
      };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating DPP config:', error);
    return NextResponse.json(
      { error: 'Failed to create DPP configuration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
