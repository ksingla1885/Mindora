import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import FolderService from '@/lib/services/folderService';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const folder = await FolderService.getFolder(id, session.user.id);
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error getting folder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get folder' },
      { status: error.message === 'Insufficient permissions' ? 403 : 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const folder = await FolderService.updateFolder(id, data, session.user.id);
    
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update folder' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await FolderService.deleteFolder(id, session.user.id);
    
    return NextResponse.json(
      { message: 'Folder deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete folder',
        code: error.code
      },
      { 
        status: error.message === 'Insufficient permissions' ? 403 : 
                error.message === 'Cannot delete folder with subfolders' ? 400 : 500 
      }
    );
  }
}
