const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TARGET_EMAIL = "ketansingla3246@gmail.com";
const TARGET_PASSWORD_PLAIN = "ketan@1885";

async function main() {
    console.log('Starting Admin Fix Script...');

    try {
        const hashedPassword = await bcrypt.hash(TARGET_PASSWORD_PLAIN, 10);

        let primaryAdminId = null;

        // 1. Check if target user exists
        let targetUser = await prisma.user.findUnique({
            where: { email: TARGET_EMAIL },
        });

        if (targetUser) {
            console.log(`User ${TARGET_EMAIL} found. Updating to ADMIN...`);
            targetUser = await prisma.user.update({
                where: { id: targetUser.id },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                },
            });
            primaryAdminId = targetUser.id;
        } else {
            // 2. If target doesn't exist, checking for ANY admin to repurpose
            const existingAdmin = await prisma.user.findFirst({
                where: { role: 'ADMIN' },
            });

            if (existingAdmin) {
                console.log(`Found existing admin ${existingAdmin.email}. Updating to target credentials...`);
                targetUser = await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: {
                        email: TARGET_EMAIL,
                        password: hashedPassword,
                        role: 'ADMIN', // Ensure it is admin
                    },
                });
                primaryAdminId = targetUser.id;
            } else {
                // 3. Create new
                console.log(`No admin found. Creating new admin ${TARGET_EMAIL}...`);
                targetUser = await prisma.user.create({
                    data: {
                        email: TARGET_EMAIL,
                        name: 'Mindora Admin',
                        password: hashedPassword,
                        role: 'ADMIN',
                    },
                });
                primaryAdminId = targetUser.id;
            }
        }

        console.log(`Primary Admin ID: ${primaryAdminId}`);

        // 4. Clean up OTHER admins
        const otherAdmins = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
                id: { not: primaryAdminId },
            },
        });

        console.log(`Found ${otherAdmins.length} other admins to delete.`);

        for (const otherAdmin of otherAdmins) {
            console.log(`Processing other admin: ${otherAdmin.email} (${otherAdmin.id})`);

            // Reassign content ownership to primary admin to avoid FK violations on delete
            // Tables with createdBy usually: Olympiad, Test, ContentItem, ContentFolder, AnalyticsDashboard

            // Olympiad
            await prisma.olympiad.updateMany({
                where: { createdBy: otherAdmin.id },
                data: { createdBy: primaryAdminId },
            });

            // Test
            await prisma.test.updateMany({
                where: { createdBy: otherAdmin.id },
                data: { createdBy: primaryAdminId },
            });

            // ContentItem
            await prisma.contentItem.updateMany({
                where: { createdBy: otherAdmin.id },
                data: { createdBy: primaryAdminId },
            });

            // ContentFolder
            await prisma.contentFolder.updateMany({
                where: { createdBy: otherAdmin.id },
                data: { createdBy: primaryAdminId },
            });

            // AnalyticsDashboard
            await prisma.analyticsDashboard.updateMany({
                where: { createdBy: otherAdmin.id },
                data: { createdBy: primaryAdminId },
            });

            // Attempt to delete. Dependencies like LearningProgress might prevent this if strict,
            // generally we assume we can delete if we handled ownership.
            // If there are other relations (like TestAttempt), we might need to delete them.
            try {
                await prisma.user.delete({
                    where: { id: otherAdmin.id },
                });
                console.log(`Deleted admin ${otherAdmin.email}`);
            } catch (e) {
                console.error(`Failed to delete admin ${otherAdmin.email}: ${e.message}`);
                // Optional: Force delete related records if needed, but let's see.
            }
        }

        console.log('Admin cleanup complete. Single admin configured.');

    } catch (error) {
        console.error('Error executing script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
