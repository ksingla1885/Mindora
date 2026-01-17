// Seed script to populate Class 11 Chemistry topics
// Run this with: node scripts/seed-chemistry-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class11ChemistryTopics = [
    // Physical Chemistry
    {
        name: "Some Basic Concepts of Chemistry",
        summary: "Mole concept, stoichiometry, limiting reagent",
        difficulty: "beginner"
    },
    {
        name: "Structure of Atom",
        summary: "Bohr model, quantum numbers, electronic configuration",
        difficulty: "intermediate"
    },
    {
        name: "States of Matter (Gases and Liquids)",
        summary: "Gas laws, kinetic theory, real gases",
        difficulty: "intermediate"
    },
    {
        name: "Thermodynamics",
        summary: "Enthalpy, entropy, Gibbs free energy, laws of thermodynamics",
        difficulty: "advanced"
    },
    {
        name: "Equilibrium",
        summary: "Chemical equilibrium, Le Chatelier's principle, ionic equilibrium (pH, buffers, solubility product)",
        difficulty: "advanced"
    },
    {
        name: "Redox Reactions",
        summary: "Oxidation number, balancing redox equations",
        difficulty: "intermediate"
    },

    // Inorganic Chemistry
    {
        name: "Classification of Elements and Periodicity",
        summary: "Periodic trends, anomalies",
        difficulty: "intermediate"
    },
    {
        name: "Chemical Bonding and Molecular Structure",
        summary: "VBT, MOT, hybridization, VSEPR, hydrogen bonding",
        difficulty: "advanced"
    },
    {
        name: "Hydrogen",
        summary: "Isotopes, hydrides",
        difficulty: "beginner"
    },
    {
        name: "s-Block Elements",
        summary: "Alkali & alkaline earth metals",
        difficulty: "intermediate"
    },
    {
        name: "Some p-Block Elements",
        summary: "Groups 13 & 14 (B, C, Si chemistry)",
        difficulty: "intermediate"
    },
    {
        name: "Environmental Chemistry",
        summary: "Environmental pollution and protection",
        difficulty: "beginner"
    },

    // Organic Chemistry
    {
        name: "Organic Chemistry - Basic Principles and Techniques",
        summary: "IUPAC nomenclature, inductive effect, resonance, hyperconjugation, acids & bases, reaction intermediates",
        difficulty: "intermediate"
    },
    {
        name: "Hydrocarbons",
        summary: "Alkanes, alkenes, alkynes, aromatic hydrocarbons (benzene, EAS basics)",
        difficulty: "intermediate"
    }
];

async function seedChemistryTopics() {
    try {
        console.log('🚀 Starting to seed Class 11 Chemistry topics...');

        // 1. Find or create Chemistry subject
        let chemistrySubject = await prisma.subject.findFirst({
            where: { name: 'Chemistry (Class 11)' }
        });

        if (!chemistrySubject) {
            console.log('🧪 Creating Chemistry (Class 11) subject...');
            chemistrySubject = await prisma.subject.create({
                data: {
                    name: 'Chemistry (Class 11)',
                    description: 'Dive into the microscopic world of atoms, chemical bonding, and organic chemistry.'
                }
            });
            console.log('✅ Chemistry (Class 11) subject created');
        } else {
            console.log('✅ Chemistry (Class 11) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class11ChemistryTopics) {
            const existing = await prisma.topic.findFirst({
                where: {
                    name: topicData.name,
                    subjectId: chemistrySubject.id
                }
            });

            if (existing) {
                console.log(`⏭️  Skipped: ${topicData.name} (already exists)`);
                skippedCount++;
            } else {
                await prisma.topic.create({
                    data: {
                        ...topicData,
                        subjectId: chemistrySubject.id
                    }
                });
                console.log(`✅ Created: ${topicData.name}`);
                createdCount++;
            }
        }

        console.log('\n🎉 Seeding complete!');
        console.log(`   Created: ${createdCount} topics`);
        console.log(`   Skipped: ${skippedCount} topics (already existed)`);
        console.log(`   Total: ${class11ChemistryTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedChemistryTopics();
