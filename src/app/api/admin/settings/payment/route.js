import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage (replace with database in production)
let paymentSettings = {
  gateways: {
    razorpay: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: '',
      webhookSecret: '',
    },
    stripe: {
      enabled: false,
      testMode: true,
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
    },
    paypal: {
      enabled: false,
      testMode: true,
      clientId: '',
      clientSecret: '',
    },
  },
  plans: [],
  coupons: [],
  taxRates: [],
};

// Helper function to check admin access
async function checkAdminAccess(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (session.user.role !== 'ADMIN') {
    return { error: 'Forbidden', status: 403 };
  }

  return { session };
}

// GET /api/admin/settings/payment - Get all payment settings
export async function GET(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data: paymentSettings });
}

// POST /api/admin/settings/payment - Update payment settings
export async function POST(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const data = await request.json();
    
    // Validate the incoming data
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update the settings
    if (data.gateways) {
      paymentSettings.gateways = {
        ...paymentSettings.gateways,
        ...data.gateways,
      };
    }

    return NextResponse.json({ 
      success: true, 
      data: paymentSettings 
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
