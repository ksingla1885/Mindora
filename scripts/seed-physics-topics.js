// Seed script to populate Class 11 Physics topics
// Run this with: node scripts/seed-physics-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class11PhysicsTopics = [
    {
        name: "Physical World and Measurement",
        summary: "Measurements, SI units, accuracy & precision, dimensional analysis, errors & significant figures",
        difficulty: "beginner"
    },
    {
        name: "Kinematics",
        summary: "Motion in one & two dimensions, vectors, relative motion, projectile motion",
        difficulty: "beginner"
    },
    {
        name: "Laws of Motion",
        summary: "Newton's laws, friction, dynamics, inertial/non-inertial frames",
        difficulty: "intermediate"
    },
    {
        name: "Work, Energy and Power",
        summary: "Work–energy theorem, power, conservative forces, potential energy",
        difficulty: "intermediate"
    },
    {
        name: "Rotational Mechanics and Rigid Bodies",
        summary: "Rotation, torque, moment of inertia, angular momentum",
        difficulty: "intermediate"
    },
    {
        name: "Gravitation",
        summary: "Universal law of gravitation, Kepler's laws",
        difficulty: "intermediate"
    },
    {
        name: "Fluid Mechanics",
        summary: "Pressure, buoyancy, continuity",
        difficulty: "intermediate"
    },
    {
        name: "Thermodynamics and Molecular Physics",
        summary: "Heat, internal energy, first & second laws, ideal gas law, processes (isothermal, adiabatic)",
        difficulty: "advanced"
    },
    {
        name: "Oscillations and Waves",
        summary: "Simple harmonic motion, wave basics, Doppler effect",
        difficulty: "intermediate"
    }
];

async function seedPhysicsTopics() {
    try {
        console.log('🚀 Starting to seed Class 11 Physics topics...');

        // 1. Find or create Physics subject
        let physicsSubject = await prisma.subject.findFirst({
            where: { name: 'Physics (Class 11)' }
        });

        if (!physicsSubject) {
            console.log('📘 Creating Physics (Class 11) subject...');
            physicsSubject = await prisma.subject.create({
                data: {
                    name: 'Physics (Class 11)',
                    description: 'Understand the laws governing the universe, from kinematics to thermodynamics and waves.'
                }
            });
            console.log('✅ Physics (Class 11) subject created');
        } else {
            console.log('✅ Physics (Class 11) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class11PhysicsTopics) {
            const existing = await prisma.topic.findFirst({
                where: {
                    name: topicData.name,
                    subjectId: physicsSubject.id
                }
            });

            if (existing) {
                console.log(`⏭️  Skipped: ${topicData.name} (already exists)`);
                skippedCount++;
            } else {
                await prisma.topic.create({
                    data: {
                        ...topicData,
                        subjectId: physicsSubject.id
                    }
                });
                console.log(`✅ Created: ${topicData.name}`);
                createdCount++;
            }
        }

        console.log('\n🎉 Seeding complete!');
        console.log(`   Created: ${createdCount} topics`);
        console.log(`   Skipped: ${skippedCount} topics (already existed)`);
        console.log(`   Total: ${class11PhysicsTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedPhysicsTopics();
