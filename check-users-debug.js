const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ketansingla3246@gmail.com' }
    });
    console.log('Admin User:', user);
    
    // Check for ANY users
    const firstFive = await prisma.user.findMany({ take: 5 });
    console.log('First 5 users in DB:', firstFive.map(u => ({ email: u.email, role: u.role })));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
