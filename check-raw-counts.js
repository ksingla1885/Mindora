const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  try {
    const students = await prisma.user.count({ where: { role: 'STUDENT' } });
    const allUsers = await prisma.user.count();
    const tests = await prisma.test.count();
    const attempts = await prisma.testAttempt.count();
    const contents = await prisma.contentItem.count();
    const subjects = await prisma.subject.count();

    console.log('--- DB COUNTS ---');
    console.log('Students (role: STUDENT):', students);
    console.log('Total Users (any role):', allUsers);
    console.log('Total Tests:', tests);
    console.log('Total Attempts:', attempts);
    console.log('Total Content:', contents);
    console.log('Total Subjects:', subjects);
  } catch (err) {
    console.error('Error fetching counts:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
