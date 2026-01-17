// Clean only Class 12 topics from database
// Run this with: node scripts/clean-class12-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List of Class 12 topic names to delete
const class12TopicNames = [
    // Class 12 Physics
    "Electric Charges and Fields",
    "Electrostatic Potential and Capacitance",
    "Current Electricity",
    "Moving Charges and Magnetism",
    "Magnetism and Matter",
    "Electromagnetic Induction",
    "Alternating Current",
    "Electromagnetic Waves",
    "Ray Optics and Optical Instruments",
    "Wave Optics",
    "Dual Nature of Radiation and Matter",
    "Atoms",
    "Nuclei",
    "Semiconductor Electronics",

    // Class 12 Chemistry
    "Solid State",
    "Solutions",
    "Electrochemistry",
    "Chemical Kinetics",
    "Surface Chemistry",
    "General Principles and Processes of Isolation of Elements",
    "p-Block Elements (Groups 15-18)",
    "d- and f-Block Elements",
    "Coordination Compounds",
    "Haloalkanes and Haloarenes",
    "Alcohols, Phenols and Ethers",
    "Aldehydes, Ketones and Carboxylic Acids",
    "Amines",
    "Biomolecules",
    "Polymers",
    "Chemistry in Everyday Life",

    // Class 12 Mathematics
    "Continuity and Differentiability",
    "Applications of Derivatives",
    "Integrals",
    "Differential Equations",
    "Matrices",
    "Determinants",
    "Vector Algebra",
    "Three-Dimensional Geometry",
    "Probability",
    "Linear Programming",

    // Class 12 Astronomy
    "Celestial Mechanics",
    "Earth, Moon and Time",
    "Solar and Lunar Eclipses",
    "Solar Physics",
    "Stellar Magnitudes and Luminosity",
    "Stellar Spectra and Classification",
    "Star Formation and Main Sequence",
    "Stellar Death and Remnants",
    "Galaxies and Cosmology",
    "Telescopes and Observational Techniques",
    "Mathematical and Physics Tools for Astronomy"
];

async function cleanClass12Topics() {
    try {
        console.log('🧹 Starting to clean Class 12 topics from database...\n');

        let deletedCount = 0;

        for (const topicName of class12TopicNames) {
            const result = await prisma.topic.deleteMany({
                where: { name: topicName }
            });

            if (result.count > 0) {
                console.log(`✅ Deleted: ${topicName}`);
                deletedCount += result.count;
            }
        }

        console.log(`\n🎉 Cleanup complete!`);
        console.log(`   Deleted ${deletedCount} Class 12 topics`);
        console.log(`   Class 11 topics remain untouched\n`);

    } catch (error) {
        console.error('❌ Error cleaning topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanClass12Topics();
