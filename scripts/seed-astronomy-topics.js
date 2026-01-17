// Seed script to populate Class 11 Astronomy topics
// Run this with: node scripts/seed-astronomy-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class11AstronomyTopics = [
    // Basics of Astronomy
    {
        name: "Basics of Astronomy",
        summary: "Celestial sphere, horizon system & equatorial coordinates, right ascension, declination, altitude, azimuth, sidereal vs solar time",
        difficulty: "beginner"
    },

    // Earth & Sky Motions
    {
        name: "Earth and Sky Motions",
        summary: "Rotation & revolution of Earth, seasons, solstices, equinoxes, precession & nutation",
        difficulty: "intermediate"
    },
    {
        name: "Eclipses and Lunar Phases",
        summary: "Solar & lunar eclipses, phases of the Moon",
        difficulty: "beginner"
    },

    // Solar System
    {
        name: "The Sun",
        summary: "Sun structure & energy generation",
        difficulty: "intermediate"
    },
    {
        name: "Planets and Solar System",
        summary: "Planets: terrestrial vs gaseous, Kepler's laws (applications), asteroids, comets, meteors, satellites & rings",
        difficulty: "intermediate"
    },

    // Stars
    {
        name: "Stars and Stellar Properties",
        summary: "Apparent & absolute magnitude, luminosity, brightness, parallax & distance measurement",
        difficulty: "intermediate"
    },
    {
        name: "HR Diagram and Binary Stars",
        summary: "HR diagram (basic interpretation), binary stars (intro)",
        difficulty: "advanced"
    },

    // Stellar Evolution
    {
        name: "Stellar Evolution",
        summary: "Formation of stars, main sequence, red giants, white dwarfs, supernovae, neutron stars & black holes (conceptual)",
        difficulty: "advanced"
    },

    // Galaxies & Universe
    {
        name: "Galaxies and Universe",
        summary: "Milky Way structure, types of galaxies, clusters & superclusters, expanding universe (intro)",
        difficulty: "advanced"
    },
    {
        name: "Dark Matter and Dark Energy",
        summary: "Dark matter & dark energy (conceptual only)",
        difficulty: "advanced"
    },

    // Mathematical & Physics Tools
    {
        name: "Mathematical and Physics Tools in Astronomy",
        summary: "Trigonometry (angles, triangles), basic logarithms, graph interpretation, Newton's laws in astronomy, gravitation applications",
        difficulty: "intermediate"
    },

    // Observational Astronomy
    {
        name: "Observational Astronomy",
        summary: "Telescopes (refracting & reflecting), light pollution, resolution & magnification, basic spectroscopy (intro), naked-eye sky observations",
        difficulty: "beginner"
    }
];

async function seedAstronomyTopics() {
    try {
        console.log('🚀 Starting to seed Class 11 Astronomy topics...');

        // 1. Find or create Astronomy subject
        let astronomySubject = await prisma.subject.findFirst({
            where: { name: 'Astronomy (Class 11)' }
        });

        if (!astronomySubject) {
            console.log('🔭 Creating Astronomy (Class 11) subject...');
            astronomySubject = await prisma.subject.create({
                data: {
                    name: 'Astronomy (Class 11)',
                    description: 'Explore the cosmos, celestial mechanics, and the life cycles of stars.'
                }
            });
            console.log('✅ Astronomy (Class 11) subject created');
        } else {
            console.log('✅ Astronomy (Class 11) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class11AstronomyTopics) {
            const existing = await prisma.topic.findFirst({
                where: {
                    name: topicData.name,
                    subjectId: astronomySubject.id
                }
            });

            if (existing) {
                console.log(`⏭️  Skipped: ${topicData.name} (already exists)`);
                skippedCount++;
            } else {
                await prisma.topic.create({
                    data: {
                        ...topicData,
                        subjectId: astronomySubject.id
                    }
                });
                console.log(`✅ Created: ${topicData.name}`);
                createdCount++;
            }
        }

        console.log('\n🎉 Seeding complete!');
        console.log(`   Created: ${createdCount} topics`);
        console.log(`   Skipped: ${skippedCount} topics (already existed)`);
        console.log(`   Total: ${class11AstronomyTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAstronomyTopics();
