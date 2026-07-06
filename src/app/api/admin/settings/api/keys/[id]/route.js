import { NextResponse } from 'next/server';
import { auth } from '@/auth';

async function checkAdminAccess() {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (session.user.role !== 'ADMIN') {
    return { error: 'Forbidden', status: 403 };
  }
  return { session };
}

// DELETE /api/admin/settings/api/keys/[id] - Revoke API Key
export async function DELETE(request, { params }) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await params;
    
    global._apiKeys = global._apiKeys || [];
    const keyIndex = global._apiKeys.findIndex(k => k.id === id);
    
    if (keyIndex === -1) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Set isActive to false instead of removing it (matching standard practice and showing "Revoked" state in list)
    global._apiKeys[keyIndex].isActive = false;

    return NextResponse.json({
      success: true,
      message: 'API Key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
