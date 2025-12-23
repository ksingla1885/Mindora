
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing database connection...');
        const count = await prisma.user.count();
        console.log('Successfully connected to database. User count:', count);

        console.log('Testing findUnique...');
        const user = await prisma.user.findUnique({
            where: { email: 'test@example.com' }
        });
        console.log('findUnique successful. User found:', user);

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
