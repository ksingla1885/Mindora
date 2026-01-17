// Seed script to populate Class 12 Mathematics topics
// Run this with: node scripts/seed-mathematics-class12-topics.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const class12MathematicsTopics = [
    // Calculus (Highest Priority)
    {
        name: "Continuity and Differentiability",
        summary: "Limits, continuity, differentiability, chain rule, implicit differentiation",
        difficulty: "advanced"
    },
    {
        name: "Applications of Derivatives",
        summary: "Increasing/decreasing functions, maxima & minima, tangents & normals",
        difficulty: "advanced"
    },
    {
        name: "Integrals",
        summary: "Indefinite integrals (substitution, parts), definite integrals & properties, area under curves",
        difficulty: "advanced"
    },
    {
        name: "Differential Equations",
        summary: "Order & degree, variable separable equations",
        difficulty: "advanced"
    },

    // Algebra
    {
        name: "Matrices",
        summary: "Types, operations, determinants & properties",
        difficulty: "intermediate"
    },
    {
        name: "Determinants",
        summary: "Minors & cofactors, area of triangle, solution of linear equations",
        difficulty: "intermediate"
    },

    // Vector Algebra
    {
        name: "Vector Algebra",
        summary: "Vectors & scalars, dot & cross product, scalar triple product",
        difficulty: "advanced"
    },

    // Three-Dimensional Geometry
    {
        name: "Three-Dimensional Geometry",
        summary: "Direction cosines & ratios, equation of line, angle between lines, distance between skew lines",
        difficulty: "advanced"
    },

    // Probability
    {
        name: "Probability",
        summary: "Conditional probability, Bayes' theorem, random variables, mean & variance",
        difficulty: "advanced"
    },

    // Linear Programming
    {
        name: "Linear Programming",
        summary: "Constraints, feasible region, optimization",
        difficulty: "intermediate"
    }
];

async function seedClass12MathematicsTopics() {
    try {
        console.log('🚀 Starting to seed Class 12 Mathematics topics...');

        // 1. Find Mathematics subject
        let mathematicsSubject = await prisma.subject.findFirst({
            where: { name: 'Mathematics (Class 12)' }
        });

        if (!mathematicsSubject) {
            console.log('📐 Creating Mathematics (Class 12) subject...');
            mathematicsSubject = await prisma.subject.create({
                data: {
                    name: 'Mathematics (Class 12)',
                    description: 'Final sprint towards competitive success. Relations, Calculus, Vectors, and Probability.'
                }
            });
            console.log('✅ Mathematics (Class 12) subject created');
        } else {
            console.log('✅ Mathematics (Class 12) subject already exists');
        }

        // 2. Create topics
        console.log('📝 Creating Class 12 Mathematics topics...');
        let createdCount = 0;
        let skippedCount = 0;

        for (const topicData of class12MathematicsTopics) {
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
        console.log(`   Total: ${class12MathematicsTopics.length} topics`);

    } catch (error) {
        console.error('❌ Error seeding topics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedClass12MathematicsTopics();
