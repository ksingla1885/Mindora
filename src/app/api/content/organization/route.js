import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ContentOrganizationService from '@/services/content/contentOrganization.service';

// GET /api/content/organization - Get folder structure
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId') || null;
    const topicId = searchParams.get('topicId');
    const classLevel = searchParams.get('classLevel');

    const folderTree = await ContentOrganizationService.getFolderTree(parentId, {
      topicId,
      classLevel
    });

    return NextResponse.json(folderTree);
  } catch (error) {
    console.error('Error fetching folder structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder structure', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/content/organization - Create a new folder
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, parentId, topicId, classLevel, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const folder = await ContentOrganizationService.createFolder(
      name,
      { parentId, topicId, classLevel, description },
      session.user.id
    );

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/content/organization - Update a folder
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { folderId, ...updates } = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    const updatedFolder = await ContentOrganizationService.updateFolder(
      folderId,
      updates,
      session.user.id
    );

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/content/organization - Delete a folder
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    await ContentOrganizationService.deleteFolder(folderId, session.user.id);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete folder', details: error.message },
      { status: error.status || 500 }
    );
  }
}
