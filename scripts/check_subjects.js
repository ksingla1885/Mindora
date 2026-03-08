const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubjects() {
    try {
        const subjects = await prisma.subject.findMany({
            select: { id: true, name: true, class: true }
        });
        console.log('--- SUBJECTS ---');
        console.table(subjects);

        const questions = await prisma.question.findMany({
            take: 5,
            include: {
                topic: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        console.log('\n--- SAMPLE QUESTIONS ---');
        questions.forEach(q => {
            console.log(`Q: ${q.text.substring(0, 30)}... | Subject: ${q.topic.subject.name} | SubjClass: ${q.topic.subject.class}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSubjects();
