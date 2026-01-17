// Seed script to populate Class 11 Mathematics topics
// Run this with: node scripts/seed-mathematics-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class11MathematicsTopics = [
    // Algebra (Highest Priority)
    {
        name: "Sets, Relations and Functions",
        summary: "Domain–range, composition, inverse functions",
        difficulty: "intermediate"
    },
    {
        name: "Complex Numbers",
        summary: "Algebra of complex numbers, modulus–argument, geometry on Argand plane",
        difficulty: "advanced"
    },
    {
        name: "Quadratic Equations",
        summary: "Nature of roots, transformations, inequalities",
        difficulty: "intermediate"
    },
    {
        name: "Sequences and Series",
        summary: "AP, GP, HP, special sums, telescoping, recurrence basics",
        difficulty: "advanced"
    },
    {
        name: "Permutations and Combinations",
        summary: "Fundamental counting principle, binomial coefficients, identities",
        difficulty: "intermediate"
    },
    {
        name: "Binomial Theorem",
        summary: "Expansion, middle terms, properties",
        difficulty: "intermediate"
    },

    // Coordinate Geometry
    {
        name: "Straight Lines",
        summary: "Slope, angle between lines, distance",
        difficulty: "beginner"
    },
    {
        name: "Conic Sections",
        summary: "Circle, parabola, ellipse, hyperbola (standard forms)",
        difficulty: "advanced"
    },
    {
        name: "Introduction to 3D Geometry",
        summary: "Distance between points, section formula",
        difficulty: "intermediate"
    },

    // Trigonometry
    {
        name: "Trigonometric Functions",
        summary: "Identities, graphs, transformations",
        difficulty: "intermediate"
    },
    {
        name: "Trigonometric Equations",
        summary: "General solutions",
        difficulty: "advanced"
    },
    {
        name: "Inverse Trigonometric Functions",
        summary: "Properties, domains & ranges",
        difficulty: "advanced"
    },

    // Calculus (Foundation Level)
    {
        name: "Limits and Derivatives",
        summary: "Standard limits, derivative of algebraic & trigonometric functions",
        difficulty: "intermediate"
    },
    {
        name: "Basic Applications of Derivatives",
        summary: "Increasing/decreasing functions (intro level)",
        difficulty: "intermediate"
    },

    // Geometry & Reasoning
    {
        name: "Mathematical Reasoning",
        summary: "Statements, implications, logical equivalence",
        difficulty: "beginner"
    },
    {
        name: "Statistics and Probability",
        summary: "Mean, variance, classical probability (basic level)",
        difficulty: "intermediate"
    }
];

async function seedMathematicsTopics() {
    try {
        console.log('🚀 Starting to seed Class 11 Mathematics topics...');

        // 1. Find or create Mathematics subject
        let mathematicsSubject = await prisma.subject.findFirst({
            where: { name: 'Mathematics (Class 11)' }
        });

        if (!mathematicsSubject) {
            console.log('📐 Creating Mathematics (Class 11) subject...');
            mathematicsSubject = await prisma.subject.create({
                data: {
                    name: 'Mathematics (Class 11)',
                    description: 'Master the foundations of higher mathematics, from sets and functions to calculus and algebra.'
                }
            });
            console.log('✅ Mathematics (Class 11) subject created');
        } else {
            console.log('✅ Mathematics (Class 11) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class11MathematicsTopics) {
            const existing = await prisma.topic.findFirst({
                where: {
                    name: topicData.name,
                    subjectId: mathematicsSubject.id
                }
            });

            if (existing) {
                console.log(`⏭️  Skipped: ${topicData.name} (already exists)`);
                skippedCount++;
            } else {
                await prisma.topic.create({
                    data: {
                        ...topicData,
                        subjectId: mathematicsSubject.id
                    }
                });
                console.log(`✅ Created: ${topicData.name}`);
                createdCount++;
            }
        }

        console.log('\n🎉 Seeding complete!');
        console.log(`   Created: ${createdCount} topics`);
        console.log(`   Skipped: ${skippedCount} topics (already existed)`);
        console.log(`   Total: ${class11MathematicsTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedMathematicsTopics();
