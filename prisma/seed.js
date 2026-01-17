const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Clean Seed...');

    try {
        // 1. Clean Database (Delete all data)
        console.log('Deleting existing data...');

        // Delete dependent tables first to avoid FK constraint violations
        await prisma.review?.deleteMany({});
        await prisma.testQuestion.deleteMany({});
        await prisma.userTestAnalytics.deleteMany({});
        await prisma.testAnalytics.deleteMany({});
        await prisma.questionAnalytics.deleteMany({});
        await prisma.learningProgress.deleteMany({});
        await prisma.studySession.deleteMany({});
        await prisma.testAttempt.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.discussion.deleteMany({});
        await prisma.contentComment.deleteMany({});
        await prisma.contentItemTag.deleteMany({});
        await prisma.contentAccess.deleteMany({});
        await prisma.folderAccess.deleteMany({});
        await prisma.userBadge.deleteMany({});
        await prisma.olympiadRegistration.deleteMany({});
        await prisma.analyticsEvent.deleteMany({});

        // Delete core content tables
        await prisma.test.deleteMany({});
        await prisma.question.deleteMany({});
        await prisma.contentItem.deleteMany({});
        await prisma.contentFolder.deleteMany({});
        await prisma.topic.deleteMany({});
        await prisma.subject.deleteMany({});
        await prisma.olympiad.deleteMany({});
        await prisma.contentTag.deleteMany({});
        await prisma.badge.deleteMany({});
        await prisma.analyticsDashboard.deleteMany({});

        // Delete auth tables
        await prisma.account.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.verificationToken.deleteMany({});

        // Delete users
        await prisma.user.deleteMany({});

        console.log('Data cleared.');

        // 2. Create the Single Admin Account
        console.log('Creating Admin Account...');
        const hashedPassword = await bcrypt.hash('ketan@1885', 10);

        const admin = await prisma.user.create({
            data: {
                email: 'ketansingla3246@gmail.com',
                name: 'Mindora Admin',
                password: hashedPassword,
                role: 'ADMIN',
                emailVerified: new Date(),
                image: null,
            },
        });

        console.log(`Admin created: ${admin.email}`);

        // 3. Create Core Subjects
        console.log('Seeding Subjects...');
        const subjects = ["Physics", "Chemistry", "Mathematics", "Science", "Astronomy"];
        for (const name of subjects) {
            await prisma.subject.create({
                data: {
                    name,
                    description: `Core subject: ${name}`,
                    topics: {
                        create: [] // Creates valid parent for future topics
                    }
                }
            });
        }
        console.log('Subjects seeded.');

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
