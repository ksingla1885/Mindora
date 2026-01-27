const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const testId = 'cmkwmsxxn0000ck44w0akwtae'; // Physics test ID from debug output

        console.log(`Clearing attempts for test ID: ${testId}`);

        const deleteResult = await prisma.testAttempt.deleteMany({
            where: {
                testId: testId
            }
        });

        console.log(`Deleted ${deleteResult.count} attempts.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
