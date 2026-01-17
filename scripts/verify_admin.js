const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Admin User...');
    const email = 'ketansingla3246@gmail.com';

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log('SUCCESS: Admin user found.');
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
        } else {
            console.log('FAILURE: Admin user NOT found.');
        }

        const count = await prisma.user.count();
        console.log(`Total users in DB: ${count}`);

    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
