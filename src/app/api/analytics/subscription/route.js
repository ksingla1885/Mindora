import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// Get subscription analytics
// GET /api/analytics/subscription?startDate=...&endDate=...&plan=...
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view subscription analytics' },
        { status: 401 }
      );
    }

    // Check if user has permission to view subscription data
    if (!hasPermission(session.user.role, ['ADMIN', 'FINANCE'])) {
      return NextResponse.json(
        { error: 'You do not have permission to view this data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const plan = searchParams.get('plan'); // Optional: filter by specific plan
    
    // Set default date range to last 90 days if not specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(new Date().setDate(endDate.getDate() - 90));

    // Base where clause for subscription queries
    const baseWhere = {
      startDate: { lte: endDate },
      OR: [
        { endDate: null },
        { endDate: { gte: startDate } },
      ],
      ...(plan ? { planId: plan } : {}),
    };

    // Get subscription summary
    const summary = await prisma.$queryRaw`
      WITH active_subscriptions AS (
        SELECT 
          s.*,
          p.name as plan_name,
          p.amount as plan_amount,
          p.billing_cycle,
          p.features
        FROM "Subscription" s
        JOIN "Plan" p ON s."planId" = p.id
        WHERE s."startDate" <= ${endDate}
          AND (s."endDate" IS NULL OR s."endDate" >= ${startDate})
          ${plan ? `AND s."planId" = ${plan}` : ''}
      )
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(DISTINCT "userId") as unique_customers,
        AVG(
          CASE 
            WHEN "billing_cycle" = 'monthly' THEN "plan_amount"
            WHEN "billing_cycle" = 'yearly' THEN "plan_amount" / 12
            ELSE "plan_amount"
          END
        ) as average_mrr_per_subscription,
        SUM(
          CASE 
            WHEN "billing_cycle" = 'monthly' THEN "plan_amount"
            WHEN "billing_cycle" = 'yearly' THEN "plan_amount" / 12
            ELSE "plan_amount"
          END
        ) as total_mrr,
        SUM(
          CASE 
            WHEN "billing_cycle" = 'yearly' THEN "plan_amount"
            ELSE 0
          END
        ) as total_annual_contract_value,
        COUNT(DISTINCT "userId") FILTER (WHERE "billing_cycle" = 'yearly') as annual_subscriptions,
        COUNT(DISTINCT "userId") FILTER (WHERE "billing_cycle" = 'monthly') as monthly_subscriptions
      FROM active_subscriptions
    `;

    // Get MRR over time
    const mrrOverTime = await prisma.$queryRaw`
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('month', ${startDate}::timestamp),
          DATE_TRUNC('month', ${endDate}::timestamp) + INTERVAL '1 month' - INTERVAL '1 day',
          INTERVAL '1 month'
        ) as month
      )
      SELECT 
        ds.month as period,
        COALESCE(SUM(
          CASE 
            WHEN s."billingCycle" = 'yearly' THEN p.amount / 12
            ELSE p.amount
          END
        ), 0) as mrr,
        COUNT(DISTINCT s.id) as active_subscriptions
      FROM date_series ds
      LEFT JOIN "Subscription" s ON 
        s."startDate" <= ds.month
        AND (s."endDate" IS NULL OR s."endDate" > ds.month)
        ${plan ? `AND s."planId" = ${plan}` : ''}
      LEFT JOIN "Plan" p ON s."planId" = p.id
      GROUP BY ds.month
      ORDER BY ds.month
    `;

    // Get churn metrics
    const churnMetrics = await prisma.$queryRaw`
      WITH monthly_active_subscriptions AS (
        SELECT 
          DATE_TRUNC('month', "startDate") as month,
          COUNT(DISTINCT "userId") as active_users
        FROM "Subscription"
        WHERE "startDate" <= ${endDate}
          AND ("endDate" IS NULL OR "endDate" >= ${startDate})
          ${plan ? `AND "planId" = ${plan}` : ''}
        GROUP BY month
      ),
      monthly_churns AS (
        SELECT 
          DATE_TRUNC('month', "endDate") as month,
          COUNT(DISTINCT "userId") as churned_users
        FROM "Subscription"
        WHERE "endDate" IS NOT NULL
          AND "endDate" >= ${startDate}
          AND "endDate" <= ${endDate}
          ${plan ? `AND "planId" = ${plan}` : ''}
        GROUP BY month
      )
      SELECT 
        mas.month,
        mas.active_users,
        COALESCE(mc.churned_users, 0) as churned_users,
        CASE 
          WHEN mas.active_users = 0 THEN 0 
          ELSE (COALESCE(mc.churned_users, 0) * 100.0) / LAG(mas.active_users, 1, mas.active_users) OVER (ORDER BY mas.month)
        END as churn_rate
      FROM monthly_active_subscriptions mas
      LEFT JOIN monthly_churns mc ON mas.month = mc.month
      ORDER BY mas.month
    `;

    // Get plan distribution
    const planDistribution = await prisma.$queryRaw`
      SELECT 
        p.id as plan_id,
        p.name as plan_name,
        p.amount,
        p.billing_cycle,
        COUNT(s.id) as subscription_count,
        COUNT(DISTINCT s."userId") as unique_customers,
        SUM(
          CASE 
            WHEN p."billing_cycle" = 'yearly' THEN p.amount
            ELSE p.amount * 12
          END
        ) as arr,
        AVG(
          CASE 
            WHEN p."billing_cycle" = 'monthly' THEN p.amount
            WHEN p."billing_cycle" = 'yearly' THEN p.amount / 12
            ELSE p.amount
          END
        ) as avg_mrr_per_subscription
      FROM "Plan" p
      LEFT JOIN "Subscription" s ON p.id = s."planId"
        AND s."startDate" <= ${endDate}
        AND (s."endDate" IS NULL OR s."endDate" >= ${startDate})
      GROUP BY p.id, p.name, p.amount, p.billing_cycle
      ORDER BY arr DESC NULLS LAST
    `;

    // Get customer acquisition metrics
    const acquisitionMetrics = await prisma.$queryRaw`
      WITH new_customers AS (
        SELECT 
          DATE_TRUNC('month', MIN(s."startDate")) as acquisition_month,
          COUNT(DISTINCT s."userId") as new_customers,
          COUNT(s.id) as new_subscriptions
        FROM "Subscription" s
        WHERE s."startDate" >= ${startDate}
          AND s."startDate" <= ${endDate}
          ${plan ? `AND s."planId" = ${plan}` : ''}
        GROUP BY DATE_TRUNC('month', s."startDate")
      )
      SELECT 
        acquisition_month as period,
        new_customers,
        new_subscriptions,
        (SELECT COUNT(DISTINCT "userId") FROM "Subscription" 
         WHERE "startDate" <= acquisition_month + INTERVAL '1 month' - INTERVAL '1 day'
           AND ("endDate" IS NULL OR "endDate" >= acquisition_month + INTERVAL '1 month' - INTERVAL '1 day')) as total_customers
      FROM new_customers
      ORDER BY acquisition_month
    `;

    // Get customer lifetime value (LTV) and retention
    const customerLifetimeValue = await prisma.$queryRaw`
      WITH customer_metrics AS (
        SELECT 
          s."userId",
          MIN(s."startDate") as first_subscription_date,
          MAX(COALESCE(s."endDate", CURRENT_DATE)) as last_active_date,
          COUNT(DISTINCT s.id) as subscription_count,
          SUM(
            CASE 
              WHEN p."billing_cycle" = 'yearly' THEN p.amount
              ELSE p.amount * 12
            END
          ) as total_annual_value,
          EXTRACT(MONTH FROM AGE(MAX(COALESCE(s."endDate", CURRENT_DATE)), MIN(s."startDate"))) as months_active
        FROM "Subscription" s
        JOIN "Plan" p ON s."planId" = p.id
        WHERE s."startDate" <= ${endDate}
          ${plan ? `AND s."planId" = ${plan}` : ''}
        GROUP BY s."userId"
      )
      SELECT 
        AVG(months_active) as avg_customer_lifetime_months,
        AVG(total_annual_value) / 12 * AVG(months_active) as avg_lifetime_value,
        AVG(subscription_count) as avg_subscriptions_per_customer,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY months_active) as median_customer_lifetime_months,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_annual_value) as median_annual_value_per_customer
      FROM customer_metrics
    `;

    // Format the response
    const response = {
      summary: summary[0],
      mrrOverTime,
      churnMetrics,
      planDistribution,
      acquisitionMetrics,
      customerLifetimeValue: customerLifetimeValue[0],
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription analytics' },
      { status: 500 }
    );
  }
}
