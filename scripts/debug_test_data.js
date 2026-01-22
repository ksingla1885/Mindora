const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestQuestions() {
    try {
        // Get all tests
        const tests = await prisma.test.findMany({
            include: {
                _count: {
                    select: { testQuestions: true }
                },
                testQuestions: {
                    include: {
                        question: true
                    }
                }
            }
        });

        console.log(`Found ${tests.length} tests in database:`);

        tests.forEach(test => {
            console.log(`\nTest ID: ${test.id}`);
            console.log(`Title: ${test.title}`);
            console.log(`Question Count: ${test._count.testQuestions}`);

            if (test.testQuestions.length > 0) {
                console.log('Sample Question 1:');
                const q1 = test.testQuestions[0].question;
                console.log(`  ID: ${q1.id}`);
                console.log(`  Text: ${q1.text}`);
                console.log(`  Type: ${q1.type}`);
                console.log(`  Options: ${JSON.stringify(q1.options)}`);
            } else {
                console.log('  NO QUESTIONS LINKED TO THIS TEST');
            }
        });

    } catch (error) {
        console.error('Error checking tests:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTestQuestions();
