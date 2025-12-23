import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// Get financial analytics
// GET /api/analytics/financial?startDate=...&endDate=...&groupBy=...
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view financial analytics' },
        { status: 401 }
      );
    }

    // Check if user has permission to view financial data
    if (!hasPermission(session.user.role, ['ADMIN', 'FINANCE'])) {
      return NextResponse.json(
        { error: 'You do not have permission to view this data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month, year
    
    // Set default date range to last 30 days if not specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(new Date().setDate(endDate.getDate() - 30));

    // Get financial summary
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'refunded' OR status = 'cancelled' THEN total ELSE 0 END) as total_refunds,
        COUNT(DISTINCT "userId") as unique_customers,
        AVG(CASE WHEN status = 'completed' THEN total ELSE NULL END) as average_order_value
      FROM "Order"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
    `;

    // Get revenue over time
    const revenueOverTime = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "createdAt") as period,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'refunded' OR status = 'cancelled' THEN total ELSE 0 END) as refunds,
        COUNT(DISTINCT "userId") as new_customers
      FROM "Order"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Get revenue by product
    const revenueByProduct = await prisma.$queryRaw`
      SELECT 
        t.id as test_id,
        t.title as test_title,
        COUNT(oi.id) as units_sold,
        SUM(oi.total) as revenue,
        AVG(oi.price) as average_price
      FROM "OrderItem" oi
      JOIN "Test" t ON oi."testId" = t.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status = 'completed'
      GROUP BY t.id, t.title
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // Get payment method distribution
    const paymentMethodDistribution = await prisma.$queryRaw`
      SELECT 
        "paymentMethod",
        COUNT(*) as order_count,
        SUM(total) as total_amount,
        AVG(total) as average_order_value
      FROM "Order"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
        AND status = 'completed'
      GROUP BY "paymentMethod"
      ORDER BY total_amount DESC
    `;

    // Get refund analysis
    const refundAnalysis = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, o."updatedAt") as period,
        COUNT(*) as refund_count,
        SUM(o.total) as refund_amount,
        AVG(o.total) as average_refund,
        COUNT(DISTINCT o."userId") as affected_customers
      FROM "Order" o
      WHERE o.status = 'refunded'
        AND o."updatedAt" >= ${startDate}
        AND o."updatedAt" <= ${endDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Get customer lifetime value (LTV) and repeat purchase rate
    const customerMetrics = await prisma.$queryRaw`
      WITH customer_orders AS (
        SELECT 
          "userId",
          COUNT(*) as order_count,
          SUM(total) as total_spent,
          MIN("createdAt") as first_order_date,
          MAX("createdAt") as last_order_date
        FROM "Order"
        WHERE status = 'completed'
        GROUP BY "userId"
      )
      SELECT 
        AVG(total_spent) as avg_customer_lifetime_value,
        AVG(order_count) as avg_orders_per_customer,
        COUNT(CASE WHEN order_count > 1 THEN 1 END) * 100.0 / COUNT(*) as repeat_purchase_rate,
        AVG(EXTRACT(DAY FROM (last_order_date - first_order_date))) as avg_customer_lifespan_days
      FROM customer_orders
      WHERE first_order_date >= ${startDate}
        AND first_order_date <= ${endDate}
    `;

    // Get tax summary
    const taxSummary = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "createdAt") as period,
        SUM(tax) as total_tax_collected,
        SUM(total) as total_sales,
        (SUM(tax) * 100.0 / NULLIF(SUM(total), 0)) as effective_tax_rate
      FROM "Order"
      WHERE status = 'completed'
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Format the response
    const response = {
      summary: summary[0],
      timeSeries: {
        revenue: revenueOverTime,
        refunds: refundAnalysis,
        taxes: taxSummary,
      },
      productPerformance: revenueByProduct,
      paymentMethods: paymentMethodDistribution,
      customerMetrics: customerMetrics[0],
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial analytics' },
      { status: 500 }
    );
  }
}
