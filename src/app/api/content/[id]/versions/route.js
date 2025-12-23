import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ContentVersionService from '@/lib/services/contentVersionService';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { data, changeLog = '' } = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }

    const newVersion = await ContentVersionService.createVersion(
      id,
      data,
      session.user.id,
      changeLog
    );

    return NextResponse.json(newVersion);
  } catch (error) {
    console.error('Error creating content version:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create version' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const compareWith = searchParams.get('compareWith');

    // Get the content to find its version group
    const content = await prisma.contentItem.findUnique({
      where: { id },
      select: { versionGroupId: true },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If compareWith is provided, return comparison
    if (compareWith) {
      const comparison = await ContentVersionService.compareVersions(id, compareWith);
      return NextResponse.json(comparison);
    }

    // Otherwise, return version history
    const versions = await ContentVersionService.getVersionHistory(content.versionGroupId);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error getting content versions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get versions' },
      { status: 500 }
    );
  }
}

// Restore a version
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const restoredVersion = await ContentVersionService.restoreVersion(id, session.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Version restored successfully',
      data: restoredVersion,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore version' },
      { status: 500 }
    );
  }
}
