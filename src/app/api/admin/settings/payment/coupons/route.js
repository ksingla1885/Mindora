import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage (replace with database in production)
let coupons = [];

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

// GET /api/admin/settings/payment/coupons - Get all coupons
export async function GET(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data: coupons });
}

// POST /api/admin/settings/payment/coupons - Create a new coupon
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
    if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    if (coupons.some(coupon => coupon.code.toLowerCase() === data.code.toLowerCase())) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed'].includes(data.discountType)) {
      return NextResponse.json(
        { error: 'Invalid discount type' },
        { status: 400 }
      );
    }

    if (typeof data.discountValue !== 'number' || data.discountValue <= 0) {
      return NextResponse.json(
        { error: 'Valid discount value is required' },
        { status: 400 }
      );
    }

    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Create new coupon
    const newCoupon = {
      id: Date.now().toString(),
      code: data.code.trim(),
      discountType: data.discountType,
      discountValue: Number(data.discountValue.toFixed(2)),
      maxUses: Math.max(1, Math.min(Number(data.maxUses) || 100, 1000000)), // Reasonable limits
      usedCount: 0,
      minPurchase: Math.max(0, Number(data.minPurchase) || 0),
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: data.isActive !== false, // Default to true if not provided
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    coupons.push(newCoupon);

    return NextResponse.json({ 
      success: true, 
      data: newCoupon 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/payment/coupons - Update a coupon
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
        { error: 'Invalid request body or missing coupon ID' },
        { status: 400 }
      );
    }

    // Find the coupon to update
    const couponIndex = coupons.findIndex(coupon => coupon.id === data.id);
    if (couponIndex === -1) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Check if the updated code would conflict with another coupon
    if (data.code && data.code !== coupons[couponIndex].code) {
      if (coupons.some(coupon => 
        coupon.id !== data.id && 
        coupon.code.toLowerCase() === data.code.toLowerCase()
      )) {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 400 }
        );
      }
    }

    // Update the coupon
    const updatedCoupon = {
      ...coupons[couponIndex],
      ...data,
      code: data.code ? data.code.trim() : coupons[couponIndex].code,
      discountValue: typeof data.discountValue === 'number' 
        ? Number(data.discountValue.toFixed(2)) 
        : coupons[couponIndex].discountValue,
      maxUses: typeof data.maxUses === 'number' 
        ? Math.max(1, Math.min(Number(data.maxUses), 1000000)) 
        : coupons[couponIndex].maxUses,
      minPurchase: typeof data.minPurchase === 'number' 
        ? Math.max(0, Number(data.minPurchase)) 
        : coupons[couponIndex].minPurchase,
      updatedAt: new Date().toISOString(),
    };

    coupons[couponIndex] = updatedCoupon;

    return NextResponse.json({ 
      success: true, 
      data: updatedCoupon 
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/payment/coupons - Delete a coupon
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
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    const initialLength = coupons.length;
    coupons = coupons.filter(coupon => coupon.id !== id);

    if (coupons.length === initialLength) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Coupon deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
