const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
    let log = '';
    const logger = (msg) => {
        log += msg + '\n';
        console.log(msg);
    };

    try {
        logger('Starting debug...');
        const users = await prisma.user.findMany({ select: { id: true, name: true, class: true } });
        logger(`Found ${users.length} users`);

        const aryan = users.find(u => u.name && u.name.includes('Aryan'));
        if (aryan) {
            logger(`Found Aryan: ${JSON.id} Class: ${aryan.class}`);
            const dpps = await prisma.dailyPracticeProblem.findMany({
                where: { userId: aryan.id },
                include: { assignments: { include: { question: { include: { topic: { include: { subject: true } } } } } } }
            });
            logger(`Found ${dpps.length} DPPs for Aryan`);
            dpps.forEach(dpp => {
                logger(`DPP Date: ${dpp.date}`);
                if (dpp.assignments.length > 0) {
                    logger(`Subject: ${dpp.assignments[0].question.topic.subject.name} (Class: ${dpp.assignments[0].question.topic.subject.class})`);
                }
            });
        }

        const globalDPPs = await prisma.dailyPracticeProblem.findMany({
            where: { userId: null },
            include: { questions: { include: { question: { include: { topic: { include: { subject: true } } } } } } }
        });
        logger(`Found ${globalDPPs.length} global DPPs`);
        globalDPPs.forEach(dpp => {
            logger(`Global DPP Date: ${dpp.date} Class: ${dpp.class}`);
            if (dpp.questions.length > 0) {
                logger(`Subject: ${dpp.questions[0].question.topic.subject.name} (Class: ${dpp.questions[0].question.topic.subject.class})`);
            }
        });

    } catch (err) {
        logger('ERROR: ' + err.message);
    } finally {
        fs.writeFileSync('dpp_debug.log', log);
        await prisma.$disconnect();
    }
}

run();
