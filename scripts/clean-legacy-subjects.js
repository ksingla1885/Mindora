const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanLegacySubjects() {
    try {
        console.log('🧹 Starting cleanup of legacy generic subjects...');

        // These are the old generic names that caused the mixing issue
        const legacyNames = ['Physics', 'Chemistry', 'Mathematics', 'Astronomy'];

        const subjects = await prisma.subject.findMany({
            where: { name: { in: legacyNames } }
        });

        if (subjects.length === 0) {
            console.log('✅ No legacy subjects found independent of class.');
            return;
        }

        for (const sub of subjects) {
            console.log(`\nProcessing legacy subject: ${sub.name} (${sub.id})`);

            // Delete associated topics first
            const deletedTopics = await prisma.topic.deleteMany({
                where: { subjectId: sub.id }
            });
            console.log(`   - Deleted ${deletedTopics.count} topics`);

            // Delete the subject
            await prisma.subject.delete({
                where: { id: sub.id }
            });
            console.log(`   - Deleted subject: ${sub.name}`);
        }

        console.log('\n✨ Cleanup complete! You can now run the new seeding scripts.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanLegacySubjects();
