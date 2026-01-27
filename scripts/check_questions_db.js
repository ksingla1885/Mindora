
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.question.count();
        console.log(`Total questions in DB: ${count}`);

        if (count > 0) {
            const questions = await prisma.question.findMany({ take: 5 });
            console.log('First 5 questions:', JSON.stringify(questions, null, 2));
        }
    } catch (e) {
        console.error('Error querying DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
