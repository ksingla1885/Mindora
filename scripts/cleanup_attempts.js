const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up accidental NOT_STARTED attempts...');
  
  const deleted = await prisma.testAttempt.deleteMany({
    where: {
      status: 'NOT_STARTED',
    },
  });

  console.log(`Deleted ${deleted.count} accidental attempts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
