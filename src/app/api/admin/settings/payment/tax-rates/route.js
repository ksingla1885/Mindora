import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage (replace with database in production)
let taxRates = [];

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

// GET /api/admin/settings/payment/tax-rates - Get all tax rates
export async function GET(request) {
  const { error, status } = await checkAdminAccess(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data: taxRates });
}

// POST /api/admin/settings/payment/tax-rates - Create a new tax rate
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
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'Tax name is required' },
        { status: 400 }
      );
    }

    if (typeof data.rate !== 'number' || data.rate < 0 || data.rate > 100) {
      return NextResponse.json(
        { error: 'Valid tax rate (0-100%) is required' },
        { status: 400 }
      );
    }

    if (!data.country || typeof data.country !== 'string' || data.country.trim() === '') {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      );
    }

    // Check if a similar tax rate already exists
    const existingTax = taxRates.find(tax => 
      tax.country === data.country && 
      (!data.state || tax.state === data.state) &&
      (data.state || !tax.state) // If no state is provided, don't match with state-specific taxes
    );

    if (existingTax) {
      return NextResponse.json(
        { error: 'A tax rate for this location already exists' },
        { status: 400 }
      );
    }

    // Create new tax rate
    const newTaxRate = {
      id: Date.now().toString(),
      name: data.name.trim(),
      rate: Number(data.rate.toFixed(2)),
      country: data.country.trim(),
      state: data.state ? data.state.trim() : '',
      isInclusive: data.isInclusive === true,
      isActive: data.isActive !== false, // Default to true if not provided
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    taxRates.push(newTaxRate);

    return NextResponse.json({ 
      success: true, 
      data: newTaxRate 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tax rate:', error);
    return NextResponse.json(
      { error: 'Failed to create tax rate' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/payment/tax-rates - Update a tax rate
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
        { error: 'Invalid request body or missing tax rate ID' },
        { status: 400 }
      );
    }

    // Find the tax rate to update
    const taxIndex = taxRates.findIndex(tax => tax.id === data.id);
    if (taxIndex === -1) {
      return NextResponse.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }

    // Check if the updated tax would conflict with another tax rate
    if ((data.country || data.state) && 
        (data.country !== taxRates[taxIndex].country || 
         (data.state || '') !== taxRates[taxIndex].state)) {
      
      const newCountry = data.country || taxRates[taxIndex].country;
      const newState = data.state !== undefined ? data.state : taxRates[taxIndex].state;
      
      const existingTax = taxRates.find(tax => 
        tax.id !== data.id &&
        tax.country === newCountry && 
        ((!newState && !tax.state) || tax.state === newState)
      );

      if (existingTax) {
        return NextResponse.json(
          { error: 'A tax rate for this location already exists' },
          { status: 400 }
        );
      }
    }

    // Update the tax rate
    const updatedTaxRate = {
      ...taxRates[taxIndex],
      ...data,
      name: data.name ? data.name.trim() : taxRates[taxIndex].name,
      rate: typeof data.rate === 'number' 
        ? Number(data.rate.toFixed(2)) 
        : taxRates[taxIndex].rate,
      country: data.country ? data.country.trim() : taxRates[taxIndex].country,
      state: data.state !== undefined 
        ? (data.state ? data.state.trim() : '') 
        : taxRates[taxIndex].state,
      isInclusive: data.isInclusive !== undefined 
        ? data.isInclusive 
        : taxRates[taxIndex].isInclusive,
      updatedAt: new Date().toISOString(),
    };

    taxRates[taxIndex] = updatedTaxRate;

    return NextResponse.json({ 
      success: true, 
      data: updatedTaxRate 
    });
  } catch (error) {
    console.error('Error updating tax rate:', error);
    return NextResponse.json(
      { error: 'Failed to update tax rate' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/payment/tax-rates - Delete a tax rate
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
        { error: 'Tax rate ID is required' },
        { status: 400 }
      );
    }

    const initialLength = taxRates.length;
    taxRates = taxRates.filter(tax => tax.id !== id);

    if (taxRates.length === initialLength) {
      return NextResponse.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tax rate deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tax rate:', error);
    return NextResponse.json(
      { error: 'Failed to delete tax rate' },
      { status: 500 }
    );
  }
}
