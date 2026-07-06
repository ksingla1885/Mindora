import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Setup global in-memory state so it shares across modules
global._apiKeys = global._apiKeys || [
  {
    id: 'key_1',
    name: 'Production Server',
    prefix: 'sk_proj',
    lastFour: '8x9y',
    permissions: ['read', 'write'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'key_2',
    name: 'Development Env',
    prefix: 'sk_proj',
    lastFour: '2c3d',
    permissions: ['read'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  }
];

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

// GET /api/admin/settings/api/keys - List API Keys
export async function GET(request) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data: global._apiKeys });
}

// POST /api/admin/settings/api/keys - Create API Key
export async function POST(request) {
  const { error, status } = await checkAdminAccess();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const key = `sk_proj_${randomPart}`;
    
    const newKeyObj = {
      id: Date.now().toString(),
      name: data.name,
      prefix: 'sk_proj',
      lastFour: key.slice(-4),
      permissions: Array.isArray(data.permissions) ? data.permissions : ['read'],
      createdAt: new Date().toISOString(),
      isActive: true,
      key: key // Send back to client once
    };

    global._apiKeys.unshift(newKeyObj);

    return NextResponse.json({
      success: true,
      data: newKeyObj
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
