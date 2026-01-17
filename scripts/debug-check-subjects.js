const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubjects() {
    try {
        const subjects = await prisma.subject.findMany();
        console.log('Current Subjects in Database:');
        subjects.forEach(s => console.log(`- ${s.name} (ID: ${s.id})`));
    } catch (error) {
        console.error('Error fetching subjects:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSubjects();
