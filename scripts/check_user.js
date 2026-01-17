const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = "ketansingla3246@gmail.com";
    console.log(`Checking for user: ${email}`);
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (user) {
            console.log('User found:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('User NOT found in database.');
        }

        // Also list all admins to be sure
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        });
        console.log(`Total Admins found: ${admins.length}`);
        admins.forEach(a => console.log(`- ${a.email} (${a.id})`));

    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
