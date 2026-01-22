
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const testId = 'cmklfshbf0000ck1s5tmz5sab';

    console.log(`Checking test: ${testId}`);

    const test = await prisma.test.findUnique({
        where: { id: testId },
        include: {
            _count: {
                select: { attempts: true },
            },
            testQuestions: true,
        },
    });

    if (!test) {
        console.log('Test not found!');
    } else {
        console.log('Test found:', JSON.stringify(test, null, 2));
        console.log(`Attempts count: ${test._count.attempts}`);
    }

    // Also check if the questions being added exist? 
    // We don't know the exact IDs being added, but we can see what's in the DB.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
