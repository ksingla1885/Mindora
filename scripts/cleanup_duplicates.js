const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Finding duplicates in TestAttempt...');
  const attempts = await prisma.testAttempt.findMany({
    select: {
      id: true,
      userId: true,
      testId: true,
    },
  });

  const seen = new Set();
  const duplicates = [];

  for (const attempt of attempts) {
    const key = `${attempt.userId}_${attempt.testId}`;
    if (seen.has(key)) {
      duplicates.push(attempt.id);
    } else {
      seen.add(key);
    }
  }

  console.log(`Found ${duplicates.length} duplicate attempts.`);

  if (duplicates.length > 0) {
    await prisma.testAttempt.deleteMany({
      where: {
        id: { in: duplicates },
      },
    });
    console.log('Duplicates deleted.');
  }

  console.log('Finding duplicates in TestAccess...');
  const access = await prisma.testAccess.findMany({
    select: {
      id: true,
      userId: true,
      testId: true,
    },
  });

  const seenAccess = new Set();
  const duplicatesAccess = [];

  for (const item of access) {
    const key = `${item.userId}_${item.testId}`;
    if (seenAccess.has(key)) {
      duplicatesAccess.push(item.id);
    } else {
      seenAccess.add(key);
    }
  }

  console.log(`Found ${duplicatesAccess.length} duplicate access records.`);

  if (duplicatesAccess.length > 0) {
    await prisma.testAccess.deleteMany({
      where: {
        id: { in: duplicatesAccess },
      },
    });
    console.log('Duplicates deleted.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
