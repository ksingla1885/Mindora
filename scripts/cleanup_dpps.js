const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const deleted = await prisma.dailyPracticeProblem.deleteMany({
            where: {
                OR: [
                    { subjectId: null },
                    { title: "Untitled DPP" },
                    { totalQuestions: 0 }
                ]
            }
        });
        console.log(`Deleted ${deleted.count} invalid DPP records.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
