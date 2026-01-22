
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const testId = 'cmklfshbf0000ck1s5tmz5sab';

    console.log(`Clearing attempts for test: ${testId}`);

    try {
        const attempts = await prisma.testAttempt.findMany({
            where: { testId },
            select: { id: true }
        });

        console.log(`Found ${attempts.length} attempts.`);

        if (attempts.length === 0) {
            console.log('No attempts to clear.');
            return;
        }

        const { count } = await prisma.testAttempt.deleteMany({
            where: { testId }
        });

        console.log(`Deleted ${count} attempts.`);

    } catch (e) {
        console.error('Error clearing attempts:', e);
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
