
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const dpps = await prisma.dailyPracticeProblem.findMany({
        include: {
            subject: true,
            _count: {
                select: { questions: true }
            }
        }
    });
    console.log('Total DPPs:', dpps.length);
    dpps.forEach(dpp => {
        console.log(`ID: ${dpp.id}, Title: ${dpp.title}, Class: ${dpp.class}, UserID: ${dpp.userId}, Date: ${dpp.date}`);
    });

    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, class: true }
    });
    console.log('Students:', users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
