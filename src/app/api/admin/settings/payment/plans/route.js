import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage (replace with database in production)
let paymentPlans = [];

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

// GET /api/admin/settings/payment/plans - Get all payment plans
export async function GET(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data: paymentPlans });
}

// POST /api/admin/settings/payment/plans - Create a new payment plan
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

    // Basic validation
    if (!data.name || typeof data.name !== 'string') {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      );
    }

    if (typeof data.price !== 'number' || data.price < 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (!['monthly', 'quarterly', 'annually'].includes(data.billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // Create new plan
    const newPlan = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      price: Number(data.price.toFixed(2)),
      currency: data.currency || 'INR',
      billingCycle: data.billingCycle,
      features: Array.isArray(data.features) ? data.features : [],
      isActive: data.isActive !== false, // Default to true if not provided
      trialDays: Math.max(0, Math.min(Number(data.trialDays) || 0, 365)), // Cap at 1 year
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    paymentPlans.push(newPlan);

    return NextResponse.json({ 
      success: true, 
      data: newPlan 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment plan:', error);
    return NextResponse.json(
      { error: 'Failed to create payment plan' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/payment/plans - Update a payment plan
export async function PUT(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const data = await request.json();
    
    // Validate the incoming data
    if (!data || typeof data !== 'object' || !data.id) {
      return NextResponse.json(
        { error: 'Invalid request body or missing plan ID' },
        { status: 400 }
      );
    }

    // Find the plan to update
    const planIndex = paymentPlans.findIndex(plan => plan.id === data.id);
    if (planIndex === -1) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Update the plan
    const updatedPlan = {
      ...paymentPlans[planIndex],
      ...data,
      price: typeof data.price === 'number' ? Number(data.price.toFixed(2)) : paymentPlans[planIndex].price,
      updatedAt: new Date().toISOString(),
    };

    paymentPlans[planIndex] = updatedPlan;

    return NextResponse.json({ 
      success: true, 
      data: updatedPlan 
    });
  } catch (error) {
    console.error('Error updating payment plan:', error);
    return NextResponse.json(
      { error: 'Failed to update payment plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/payment/plans - Delete a payment plan
export async function DELETE(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const initialLength = paymentPlans.length;
    paymentPlans = paymentPlans.filter(plan => plan.id !== id);

    if (paymentPlans.length === initialLength) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Plan deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting payment plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment plan' },
      { status: 500 }
    );
  }
}
