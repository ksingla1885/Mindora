// Seed script to populate Class 12 Physics topics
// Run this with: node scripts/seed-physics-class12-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class12PhysicsTopics = [
    {
        name: "Electric Charges and Fields",
        summary: "Coulomb's law, electric field, Gauss's law and applications",
        difficulty: "intermediate"
    },
    {
        name: "Electrostatic Potential and Capacitance",
        summary: "Electric potential, capacitors, energy stored in capacitors, dielectrics",
        difficulty: "advanced"
    },
    {
        name: "Current Electricity",
        summary: "Ohm's law, resistance, Kirchhoff's laws, Wheatstone bridge, potentiometer",
        difficulty: "intermediate"
    },
    {
        name: "Moving Charges and Magnetism",
        summary: "Magnetic force, Lorentz force, Biot-Savart law, Ampere's law",
        difficulty: "advanced"
    },
    {
        name: "Magnetism and Matter",
        summary: "Bar magnet, Earth's magnetism, magnetic properties of materials",
        difficulty: "intermediate"
    },
    {
        name: "Electromagnetic Induction",
        summary: "Faraday's laws, Lenz's law, self-inductance, mutual inductance, eddy currents",
        difficulty: "advanced"
    },
    {
        name: "Alternating Current",
        summary: "AC circuits, LCR circuits, resonance, power factor, transformers",
        difficulty: "advanced"
    },
    {
        name: "Electromagnetic Waves",
        summary: "Displacement current, Maxwell's equations, electromagnetic spectrum",
        difficulty: "intermediate"
    },
    {
        name: "Ray Optics and Optical Instruments",
        summary: "Reflection, refraction, total internal reflection, lenses, mirrors, optical instruments",
        difficulty: "intermediate"
    },
    {
        name: "Wave Optics",
        summary: "Huygens' principle, interference, diffraction, polarization",
        difficulty: "advanced"
    },
    {
        name: "Dual Nature of Radiation and Matter",
        summary: "Photoelectric effect, de Broglie wavelength, wave-particle duality",
        difficulty: "advanced"
    },
    {
        name: "Atoms",
        summary: "Atomic models (Rutherford, Bohr), energy levels, hydrogen spectrum",
        difficulty: "intermediate"
    },
    {
        name: "Nuclei",
        summary: "Nuclear structure, radioactivity, nuclear fission and fusion",
        difficulty: "advanced"
    },
    {
        name: "Semiconductor Electronics",
        summary: "Semiconductors, p-n junction, diodes, transistors, logic gates",
        difficulty: "intermediate"
    }
];

async function seedClass12PhysicsTopics() {
    try {
        console.log('🚀 Starting to seed Class 12 Physics topics...');

        // 1. Find Physics subject
        let physicsSubject = await prisma.subject.findFirst({
            where: { name: 'Physics (Class 12)' }
        });

        if (!physicsSubject) {
            console.log('📘 Creating Physics (Class 12) subject...');
            physicsSubject = await prisma.subject.create({
                data: {
                    name: 'Physics (Class 12)',
                    description: 'Master electromagnetism, optics, and modern physics for board exams and entrance tests.'
                }
            });
            console.log('✅ Physics (Class 12) subject created');
        } else {
            console.log('✅ Physics (Class 12) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating Class 12 Physics topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class12PhysicsTopics) {
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
        console.log(`   Total: ${class12PhysicsTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedClass12PhysicsTopics();
