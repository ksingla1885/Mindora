const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAll() {
    try {
        console.log('Fetching users...');
        const users = await prisma.user.findMany({
            take: 10,
            select: { id: true, name: true, class: true }
        });
        console.log('Top 10 users:', users);

        const aryan = users.find(u => u.name && u.name.includes('Aryan'));
        if (!aryan) {
            console.log('No Aryan found in top 10. Searching...');
            const search = await prisma.user.findFirst({
                where: { name: { contains: 'Aryan', mode: 'insensitive' } }
            });
            console.log('Search result:', search);
            if (search) {
                await debugUserDPP(search.id);
            }
        } else {
            await debugUserDPP(aryan.id);
        }

    } catch (error) {
        console.error('TOP LEVEL ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function debugUserDPP(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, class: true }
    });

    console.log('--- DEBUGGING USER ---');
    console.log(user);

    const dpps = await prisma.dailyPracticeProblem.findMany({
        where: {
            OR: [
                { userId: user.id },
                { userId: null, class: user.class }
            ]
        },
        include: {
            assignments: {
                include: {
                    question: {
                        include: {
                            topic: { include: { subject: true } }
                        }
                    }
                }
            }
        },
        orderBy: { date: 'desc' },
        take: 3
    });

    console.log('\n--- DPPS FOUND ---', dpps.length);
    dpps.forEach(dpp => {
        console.log('DPP ID:', dpp.id, 'Date:', dpp.date, 'Global:', dpp.userId === null, 'Class:', dpp.class);
        if (dpp.assignments.length > 0) {
            console.log('Subject of first assignment:', dpp.assignments[0].question.topic.subject.name);
            console.log('Subject Class:', dpp.assignments[0].question.topic.subject.class);
        }
    });
}

debugAll();
