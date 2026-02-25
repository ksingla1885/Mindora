const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function count() {
    try {
        const total = await prisma.dailyPracticeProblem.count();
        const invalid = await prisma.dailyPracticeProblem.count({
            where: {
                OR: [
                    { subjectId: null },
                    { title: "Untitled DPP" },
                    { totalQuestions: 0 }
                ]
            }
        });
        console.log(`Total DPPs: ${total}`);
        console.log(`Invalid DPPs: ${invalid}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

count();
