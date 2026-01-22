const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tests = await prisma.test.findMany({
            include: {
                _count: {
                    select: { testQuestions: true }
                }
            }
        });

        console.log('--- DB STATUS ---');
        if (tests.length === 0) console.log('No tests found.');
        tests.forEach(t => {
            console.log(`Test "${t.title}": ${t._count.testQuestions} questions`);
        });
        console.log('-----------------');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
