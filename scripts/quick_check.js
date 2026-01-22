const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tests = await prisma.test.findMany({
            take: 5,
            include: {
                testQuestions: true
            }
        });

        console.log('--- TEST DATA ---');
        tests.forEach(t => {
            console.log(`Test: ${t.title} (ID: ${t.id}) - Questions: ${t.testQuestions.length}`);
        });
        console.log('-----------------');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
