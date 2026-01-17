// Master seed script - Run all subject seeds
// Run this with: node scripts/seed-all-subjects.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllSubjects() {
    try {
        console.log('🚀 Starting to seed all subjects and topics...\n');

        // Define Class 11 and Class 12 subjects
        const subjects = [
            // Class 11
            { name: 'Physics (Class 11)', description: 'Understand the laws governing the universe, from kinematics to thermodynamics and waves.' },
            { name: 'Chemistry (Class 11)', description: 'Dive into the microscopic world of atoms, chemical bonding, and organic chemistry.' },
            { name: 'Mathematics (Class 11)', description: 'Master the foundations of higher mathematics, from sets and functions to calculus and algebra.' },
            { name: 'Astronomy (Class 11)', description: 'Explore the cosmos, celestial mechanics, and the life cycles of stars.' },

            // Class 12
            { name: 'Physics (Class 12)', description: 'Advanced physics concepts including electromagnetism, optics, and modern physics.' },
            { name: 'Chemistry (Class 12)', description: 'Advanced chemistry including solid state, electrochemistry, and complex organic reactions.' },
            { name: 'Mathematics (Class 12)', description: 'Advanced calculus, vectors, 3D geometry, and probability.' },
            { name: 'Astronomy (Class 12)', description: 'Advanced celestial mechanics, stellar evolution, and cosmology.' },

            // Lower classes (generic for now if needed, or skipped)
            { name: 'Science', description: 'Explore the fundamental concepts of Matter, Life, Motion, and Natural Resources.' }
        ];

        console.log('📚 Creating subjects...');
        for (const subjectData of subjects) {
            const existing = await prisma.subject.findFirst({
                where: { name: subjectData.name }
            });

            if (!existing) {
                await prisma.subject.create({ data: subjectData });
                console.log(`✅ Created subject: ${subjectData.name}`);
            } else {
                console.log(`⏭️  Subject already exists: ${subjectData.name}`);
            }
        }

        console.log('\n✅ All subjects created!\n');
        console.log('📝 Now run individual topic seed scripts (make sure they are updated to use class-specific subject names):');
        console.log('   node scripts/seed-physics-topics.js');
        console.log('   node scripts/seed-chemistry-topics.js');

    } catch (error) {
        console.error('❌ Error seeding subjects:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAllSubjects();
