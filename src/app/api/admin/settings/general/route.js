import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisFetch(command, ...args) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}/${command}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result;
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [maintenance, selfReg, siteName, tagline, supportEmail, contactPhone] = await Promise.all([
    redisFetch('get', 'settings:maintenance_mode'),
    redisFetch('get', 'settings:allow_self_registration'),
    redisFetch('get', 'settings:site_name'),
    redisFetch('get', 'settings:tagline'),
    redisFetch('get', 'settings:support_email'),
    redisFetch('get', 'settings:contact_phone'),
  ]);

  return NextResponse.json({
    maintenanceMode: maintenance === '1',
    allowSelfRegistration: selfReg !== '0', // default true
    siteName: siteName || 'Mindora',
    tagline: tagline || 'Master Your Olympiads',
    supportEmail: supportEmail || 'support@mindora.com',
    contactPhone: contactPhone || '+1 (555) 019-2834',
  });
}

export async function POST(request) {
  const session = await auth();
  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { maintenanceMode, allowSelfRegistration, siteName, tagline, supportEmail, contactPhone } = body;

  await Promise.all([
    redisFetch('set', 'settings:maintenance_mode', maintenanceMode ? '1' : '0'),
    redisFetch('set', 'settings:allow_self_registration', allowSelfRegistration ? '1' : '0'),
    redisFetch('set', 'settings:site_name', siteName || 'Mindora'),
    redisFetch('set', 'settings:tagline', tagline || 'Master Your Olympiads'),
    redisFetch('set', 'settings:support_email', supportEmail || 'support@mindora.com'),
    redisFetch('set', 'settings:contact_phone', contactPhone || '+1 (555) 019-2834'),
  ]);

  return NextResponse.json({ success: true });
}
