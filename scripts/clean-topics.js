// Clean all topics from database
// Run this with: node scripts/clean-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTopics() {
    try {
        console.log('🧹 Starting to clean all topics from database...\n');

        // Delete all topics
        const result = await prisma.topic.deleteMany({});

        console.log(`✅ Deleted ${result.count} topics from database\n`);
        console.log('🎉 Database is clean and ready for fresh seeding!');
        console.log('   Run: node scripts/seed-class11-only.js\n');

    } catch (error) {
        console.error('❌ Error cleaning topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanTopics();
