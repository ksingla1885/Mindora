import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to validate badge data
const validateBadgeData = (badge) => {
  if (!badge.name || !badge.description || !badge.type) {
    return { valid: false, error: 'Missing required fields: name, description, and type are required' };
  }
  if (badge.xpReward && (isNaN(badge.xpReward) || badge.xpReward < 0)) {
    return { valid: false, error: 'XP reward must be a non-negative number' };
  }
  return { valid: true };
};

// Helper function to validate challenge data
const validateChallengeData = (challenge) => {
  if (!challenge.title || !challenge.description || !challenge.type) {
    return { valid: false, error: 'Missing required fields: title, description, and type are required' };
  }
  if (challenge.xpReward && (isNaN(challenge.xpReward) || challenge.xpReward < 0)) {
    return { valid: false, error: 'XP reward must be a non-negative number' };
  }
  if (challenge.startDate && isNaN(new Date(challenge.startDate).getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  if (challenge.endDate && isNaN(new Date(challenge.endDate).getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  return { valid: true };
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'badges' or 'challenges'
    const action = formData.get('action'); // 'import' or 'export'

    if (!file || !type || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: file, type, and action are required' },
        { status: 400 }
      );
    }

    if (action === 'import') {
      // Handle import
      const fileData = await file.text();
      let items;
      
      try {
        items = JSON.parse(fileData);
        if (!Array.isArray(items)) {
          throw new Error('File must contain an array of items');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid file format. Please upload a valid JSON file' },
          { status: 400 }
        );
      }

      const results = {
        total: items.length,
        success: 0,
        errors: []
      };

      // Process items in batches
      const batchSize = 50;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item, index) => {
          const itemNum = i + index + 1;
          
          try {
            if (type === 'badges') {
              const { valid, error } = validateBadgeData(item);
              if (!valid) {
                throw new Error(error);
              }
              
              await prisma.badge.upsert({
                where: { id: item.id || '' },
                update: {
                  name: item.name,
                  description: item.description,
                  type: item.type,
                  icon: item.icon || 'award',
                  xpReward: item.xpReward || 0,
                  isActive: item.isActive !== false,
                  criteria: item.criteria || {}
                },
                create: {
                  id: item.id || uuidv4(),
                  name: item.name,
                  description: item.description,
                  type: item.type,
                  icon: item.icon || 'award',
                  xpReward: item.xpReward || 0,
                  isActive: item.isActive !== false,
                  criteria: item.criteria || {}
                }
              });
            } else if (type === 'challenges') {
              const { valid, error } = validateChallengeData(item);
              if (!valid) {
                throw new Error(error);
              }
              
              const challengeData = {
                title: item.title,
                description: item.description,
                type: item.type,
                criteria: item.criteria || {},
                xpReward: item.xpReward || 0,
                badgeRewardId: item.badgeRewardId || null,
                startDate: item.startDate ? new Date(item.startDate) : new Date(),
                endDate: item.endDate ? new Date(item.endDate) : null,
                isActive: item.isActive !== false
              };
              
              await prisma.challenge.upsert({
                where: { id: item.id || '' },
                update: challengeData,
                create: {
                  id: item.id || uuidv4(),
                  ...challengeData
                }
              });
            }
            results.success++;
          } catch (error) {
            results.errors.push({
              item: itemNum,
              error: error.message || 'Unknown error'
            });
          }
        });

        await Promise.all(batchPromises);
      }

      return NextResponse.json({
        message: 'Bulk import completed',
        ...results
      });

    } else if (action === 'export') {
      // Handle export
      let data;
      
      if (type === 'badges') {
        const badges = await prisma.badge.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { userBadges: true }
            }
          }
        });
        data = JSON.stringify(badges, null, 2);
      } else if (type === 'challenges') {
        const challenges = await prisma.challenge.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { userChallenges: true }
            },
            badgeReward: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        data = JSON.stringify(challenges, null, 2);
      } else {
        return NextResponse.json(
          { error: 'Invalid type. Must be either "badges" or "challenges"' },
          { status: 400 }
        );
      }

      // Create a temporary file
      const tempDir = path.join(process.cwd(), 'tmp');
      await fs.mkdir(tempDir, { recursive: true });
      const fileName = `${type}-export-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = path.join(tempDir, fileName);
      await fs.writeFile(filePath, data, 'utf8');

      // Read the file back and send it as a response
      const fileContent = await fs.readFile(filePath);
      
      // Clean up the temp file
      await fs.unlink(filePath);

      // Return the file as a download
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be either "import" or "export"' },
      { status: 400 }
    );

  } catch (error) {
    console.error(`Error in bulk ${request.method} operation:`, error);
    return NextResponse.json(
      { error: `Failed to process bulk operation: ${error.message}` },
      { status: 500 }
    );
  }
}

// Add GET endpoint to get a template for import
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'badges' or 'challenges'

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required (badges or challenges)' },
        { status: 400 }
      );
    }

    let template;
    
    if (type === 'badges') {
      template = [
        {
          "id": "optional-uuid",
          "name": "Badge Name",
          "description": "Badge description",
          "type": "ACHIEVEMENT", // or 'SKILL', 'PARTICIPATION', 'MILESTONE'
          "icon": "award",
          "xpReward": 100,
          "isActive": true,
          "criteria": {}
        }
      ];
    } else if (type === 'challenges') {
      template = [
        {
          "id": "optional-uuid",
          "title": "Challenge Title",
          "description": "Challenge description",
          "type": "DAILY", // or 'WEEKLY', 'MONTHLY', 'SPECIAL'
          "criteria": {
            "type": "completion",
            "required": 5,
            "action": "complete_lesson"
          },
          "xpReward": 250,
          "badgeRewardId": "optional-badge-id",
          "startDate": new Date().toISOString(),
          "endDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          "isActive": true
        }
      ];
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be either "badges" or "challenges"' },
        { status: 400 }
      );
    }

    const fileName = `${type}-template.json`;
    
    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
