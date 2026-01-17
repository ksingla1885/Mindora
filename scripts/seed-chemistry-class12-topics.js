// Seed script to populate Class 12 Chemistry topics
// Run this with: node scripts/seed-chemistry-class12-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class12ChemistryTopics = [
    // Physical Chemistry
    {
        name: "Solid State",
        summary: "Crystal lattices, unit cell, packing efficiency, defects",
        difficulty: "advanced"
    },
    {
        name: "Solutions",
        summary: "Concentration terms, Raoult's law, colligative properties",
        difficulty: "advanced"
    },
    {
        name: "Electrochemistry",
        summary: "Electrochemical cells, Nernst equation, conductance, Faraday's laws",
        difficulty: "advanced"
    },
    {
        name: "Chemical Kinetics",
        summary: "Rate laws, order & molecularity, integrated rate equations, activation energy",
        difficulty: "advanced"
    },
    {
        name: "Surface Chemistry",
        summary: "Adsorption, catalysis",
        difficulty: "intermediate"
    },

    // Inorganic Chemistry
    {
        name: "General Principles and Processes of Isolation of Elements",
        summary: "Metallurgy, concentration & extraction",
        difficulty: "intermediate"
    },
    {
        name: "p-Block Elements (Groups 15-18)",
        summary: "Nitrogen, oxygen, halogens, noble gases, oxides, oxoacids, trends",
        difficulty: "advanced"
    },
    {
        name: "d- and f-Block Elements",
        summary: "Transition metals, lanthanides & actinides, color, magnetism, oxidation states",
        difficulty: "advanced"
    },
    {
        name: "Coordination Compounds",
        summary: "Werner theory, nomenclature, isomerism, VBT, CFT, stability & applications",
        difficulty: "advanced"
    },

    // Organic Chemistry
    {
        name: "Haloalkanes and Haloarenes",
        summary: "SN1, SN2, E1, E2, reactivity & stereochemistry",
        difficulty: "advanced"
    },
    {
        name: "Alcohols, Phenols and Ethers",
        summary: "Preparation & reactions, acidity/basicity",
        difficulty: "intermediate"
    },
    {
        name: "Aldehydes, Ketones and Carboxylic Acids",
        summary: "Nucleophilic addition, oxidation–reduction, named reactions",
        difficulty: "advanced"
    },
    {
        name: "Amines",
        summary: "Basicity, diazotization, coupling reactions",
        difficulty: "intermediate"
    },
    {
        name: "Biomolecules",
        summary: "Carbohydrates, proteins, nucleic acids (theory)",
        difficulty: "intermediate"
    },
    {
        name: "Polymers",
        summary: "Addition & condensation polymers",
        difficulty: "beginner"
    },
    {
        name: "Chemistry in Everyday Life",
        summary: "Drugs, detergents, food chemistry",
        difficulty: "beginner"
    }
];

async function seedClass12ChemistryTopics() {
    try {
        console.log('🚀 Starting to seed Class 12 Chemistry topics...');

        // 1. Find Chemistry subject
        let chemistrySubject = await prisma.subject.findFirst({
            where: { name: 'Chemistry (Class 12)' }
        });

        if (!chemistrySubject) {
            console.log('🧪 Creating Chemistry (Class 12) subject...');
            chemistrySubject = await prisma.subject.create({
                data: {
                    name: 'Chemistry (Class 12)',
                    description: 'Advanced study of solutions, electrochemistry, kinetics, and organic chemistry.'
                }
            });
            console.log('✅ Chemistry (Class 12) subject created');
        } else {
            console.log('✅ Chemistry (Class 12) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating Class 12 Chemistry topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class12ChemistryTopics) {
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
        console.log(`   Total: ${class12ChemistryTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedClass12ChemistryTopics();
