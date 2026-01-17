// Clean only Class 11 topics from database
// Run this with: node scripts/clean-class11-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List of Class 11 topic names to delete
const class11TopicNames = [
    // Class 11 Physics
    "Physical World and Measurement",
    "Kinematics",
    "Laws of Motion",
    "Work, Energy and Power",
    "Rotational Mechanics and Rigid Bodies",
    "Gravitation",
    "Fluid Mechanics",
    "Thermodynamics and Molecular Physics",
    "Oscillations and Waves",

    // Class 11 Chemistry
    "Some Basic Concepts of Chemistry",
    "Structure of Atom",
    "States of Matter (Gases and Liquids)",
    "Thermodynamics",
    "Equilibrium",
    "Redox Reactions",
    "Classification of Elements and Periodicity",
    "Chemical Bonding and Molecular Structure",
    "Hydrogen",
    "s-Block Elements",
    "Some p-Block Elements",
    "Environmental Chemistry",
    "Organic Chemistry - Basic Principles and Techniques",
    "Hydrocarbons",

    // Class 11 Mathematics
    "Sets, Relations and Functions",
    "Complex Numbers",
    "Quadratic Equations",
    "Sequences and Series",
    "Permutations and Combinations",
    "Binomial Theorem",
    "Straight Lines",
    "Conic Sections",
    "Introduction to 3D Geometry",
    "Trigonometric Functions",
    "Trigonometric Equations",
    "Inverse Trigonometric Functions",
    "Limits and Derivatives",
    "Basic Applications of Derivatives",
    "Mathematical Reasoning",
    "Statistics and Probability",

    // Class 11 Astronomy
    "Basics of Astronomy",
    "Earth and Sky Motions",
    "Eclipses and Lunar Phases",
    "The Sun",
    "Planets and Solar System",
    "Stars and Stellar Properties",
    "HR Diagram and Binary Stars",
    "Stellar Evolution",
    "Galaxies and Universe",
    "Dark Matter and Dark Energy",
    "Mathematical and Physics Tools in Astronomy",
    "Observational Astronomy"
];

async function cleanClass11Topics() {
    try {
        console.log('🧹 Starting to clean Class 11 topics from database...\n');

        let deletedCount = 0;

        for (const topicName of class11TopicNames) {
            const result = await prisma.topic.deleteMany({
                where: { name: topicName }
            });

            if (result.count > 0) {
                console.log(`✅ Deleted: ${topicName}`);
                deletedCount += result.count;
            }
        }

        console.log(`\n🎉 Cleanup complete!`);
        console.log(`   Deleted ${deletedCount} Class 11 topics`);
        console.log(`   Class 12 topics remain untouched\n`);

    } catch (error) {
        console.error('❌ Error cleaning topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanClass11Topics();
