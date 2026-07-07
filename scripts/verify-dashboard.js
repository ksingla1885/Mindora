const { PrismaClient } = require('@prisma/client');
const { startOfDay, endOfDay, subDays } = require('date-fns');
const { format } = require('date-fns');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check subjects
    const subjects = await prisma.subject.findMany({
      include: { _count: { select: { topics: true } } }
    });
    console.log('=== Subject Distribution ===');
    subjects.forEach(s => console.log(`  ${s.name}: ${s._count.topics} topics`));
    console.log(`  Total: ${subjects.length} subjects\n`);

    // Check recent payments
    const payments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { amount: true, status: true, createdAt: true }
    });
    console.log('=== Recent Payments ===');
    payments.forEach(p => console.log(`  ₹${p.amount} | ${p.status} | ${p.createdAt}`));
    console.log(`  Total: ${payments.length} recent payments\n`);

    // Check daily revenue (last 7 days)
    console.log('=== Daily Revenue (Last 7 Days) ===');
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const result = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfDay(date), lte: endOfDay(date) }
        },
        _sum: { amount: true }
      });
      const rev = result._sum.amount || 0;
      console.log(`  ${dayLabels[date.getDay()]} (${format(date, 'MMM dd')}): ₹${rev}`);
    }

    // Check users
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalUsers = await prisma.user.count({ where: { role: { not: 'ADMIN' } } });
    console.log(`\n=== Users ===`);
    console.log(`  Total Users (non-admin): ${totalUsers}`);
    console.log(`  Students: ${studentCount}`);

    // Check monthly performance data
    const attempts = await prisma.testAttempt.count();
    console.log(`\n=== Test Attempts ===`);
    console.log(`  Total: ${attempts}`);

    console.log('\n✅ All dashboard data queries executed successfully!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
