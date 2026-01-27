const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find the user 'ketan' or just list all attempts for the 'Physics' test to see what's going on
        // Assuming the test title involves 'Physics'
        const test = await prisma.test.findFirst({
            where: { title: { contains: 'Physics' } }
        });

        if (!test) {
            console.log("Physics test not found");
            return;
        }

        console.log(`Test: ${test.title} (${test.id})`);
        console.log(`Allow Multiple Attempts: ${test.allowMultipleAttempts}`);

        // Fetch all attempts for this test
        const attempts = await prisma.testAttempt.findMany({
            where: { testId: test.id },
            include: { user: true }
        });

        console.log(`Found ${attempts.length} attempts:`);
        attempts.forEach(a => {
            console.log(`- User: ${a.user.email} (${a.user.name}), Status: ${a.status}, ID: ${a.id}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
