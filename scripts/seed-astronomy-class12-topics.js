// Seed script to populate Class 12 Astronomy topics
// Run this with: node scripts/seed-astronomy-class12-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class12AstronomyTopics = [
    // Celestial Mechanics
    {
        name: "Celestial Mechanics",
        summary: "Newton's law of gravitation, Kepler's laws (advanced applications), orbital velocity & escape velocity, circular & elliptical orbits, tidal forces",
        difficulty: "advanced"
    },

    // Earth, Moon & Time
    {
        name: "Earth, Moon and Time",
        summary: "Earth's rotation & revolution (quantitative), precession of equinoxes, sidereal day vs solar day, time zones",
        difficulty: "intermediate"
    },
    {
        name: "Solar and Lunar Eclipses",
        summary: "Solar & lunar eclipses (geometry + numericals)",
        difficulty: "intermediate"
    },

    // Solar Physics
    {
        name: "Solar Physics",
        summary: "Structure of the Sun, nuclear fusion (pp-chain concept), sunspots, solar flares, solar wind, solar radiation & luminosity",
        difficulty: "advanced"
    },

    // Stellar Astronomy
    {
        name: "Stellar Magnitudes and Luminosity",
        summary: "Stellar magnitudes (apparent & absolute), luminosity–flux relation, parallax & distance measurement",
        difficulty: "advanced"
    },
    {
        name: "Stellar Spectra and Classification",
        summary: "Stellar spectra & classification (OBAFGKM), binary star systems (mass determination)",
        difficulty: "advanced"
    },

    // Stellar Evolution
    {
        name: "Star Formation and Main Sequence",
        summary: "Star formation, main sequence lifetime",
        difficulty: "advanced"
    },
    {
        name: "Stellar Death and Remnants",
        summary: "Red giants & supergiants, white dwarfs, neutron stars, supernovae & black holes (conceptual + graphs)",
        difficulty: "advanced"
    },

    // Galaxies & Cosmology
    {
        name: "Galaxies and Cosmology",
        summary: "Milky Way structure, galaxy classification, rotation curves & dark matter, Hubble's law, expanding universe",
        difficulty: "advanced"
    },

    // Observational Astronomy
    {
        name: "Telescopes and Observational Techniques",
        summary: "Telescopes (refractors & reflectors), resolving power, magnification, CCD detectors (basic), spectroscopy fundamentals",
        difficulty: "intermediate"
    },

    // Mathematical & Physics Tools
    {
        name: "Mathematical and Physics Tools for Astronomy",
        summary: "Trigonometry & logarithms, graph interpretation, error analysis, basic calculus usage, Class 11–12 Physics integration (mechanics, optics)",
        difficulty: "advanced"
    }
];

async function seedClass12AstronomyTopics() {
    try {
        console.log('🚀 Starting to seed Class 12 Astronomy topics...');

        // 1. Find Astronomy subject
        let astronomySubject = await prisma.subject.findFirst({
            where: { name: 'Astronomy (Class 12)' }
        });

        if (!astronomySubject) {
            console.log('🔭 Creating Astronomy (Class 12) subject...');
            astronomySubject = await prisma.subject.create({
                data: {
                    name: 'Astronomy (Class 12)',
                    description: 'Advanced celestial mechanics, stellar evolution, and cosmology.'
                }
            });
            console.log('✅ Astronomy (Class 12) subject created');
        } else {
            console.log('✅ Astronomy (Class 12) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating Class 12 Astronomy topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class12AstronomyTopics) {
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
        console.log(`   Total: ${class12AstronomyTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedClass12AstronomyTopics();
