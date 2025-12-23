const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const SUBJECTS = [
    {
        name: 'Physics',
        description: 'Study of matter, energy, and the fundamental forces of nature.',
        topics: [
            { name: 'Kinematics', summary: 'Motion of objects without reference to forces.', difficulty: 'medium' },
            { name: 'Dynamics', summary: 'Forces and their effect on motion.', difficulty: 'hard' },
            { name: 'Optics', summary: 'Behavior and properties of light.', difficulty: 'hard' },
            { name: 'Thermodynamics', summary: 'Heat, work, and temperature.', difficulty: 'medium' },
            { name: 'Electromagnetism', summary: 'Electric and magnetic fields.', difficulty: 'hard' }
        ]
    },
    {
        name: 'Chemistry',
        description: 'Study of substances, their properties, and reactions.',
        topics: [
            { name: 'Atomic Structure', summary: 'Protons, neutrons, electrons and orbitals.', difficulty: 'medium' },
            { name: 'Chemical Bonding', summary: 'Ionic, covalent, and metallic bonds.', difficulty: 'hard' },
            { name: 'Stoichiometry', summary: 'Quantitative relationships in chemical reactions.', difficulty: 'medium' },
            { name: 'Organic Chemistry', summary: 'Carbon-based compounds.', difficulty: 'hard' }
        ]
    },
    {
        name: 'Mathematics',
        description: 'Study of numbers, structure, space, and change.',
        topics: [
            { name: 'Algebra', summary: 'Symbols and the rules for manipulating those symbols.', difficulty: 'medium' },
            { name: 'Geometry', summary: 'Shapes, sizes, and properties of space.', difficulty: 'medium' },
            { name: 'Trigonometry', summary: 'Relationships between side lengths and angles of triangles.', difficulty: 'hard' },
            { name: 'Calculus', summary: 'Continuous change.', difficulty: 'hard' }
        ]
    },
    {
        name: 'Biology',
        description: 'Study of life and living organisms.',
        topics: [
            { name: 'Cell Biology', summary: 'Structure and function of the cell.', difficulty: 'medium' },
            { name: 'Genetics', summary: 'Genes, heredity, and variation.', difficulty: 'hard' },
            { name: 'Ecology', summary: 'Interactions among organisms and their environment.', difficulty: 'medium' }
        ]
    }
];

async function main() {
    console.log('Start seeding...');

    try {
        // 1. Create Admin User
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { email: 'admin@mindora.com' },
            update: {},
            create: {
                email: 'admin@mindora.com',
                name: 'Admin User',
                password: adminPassword,
                role: 'ADMIN',
            },
        });
        console.log('Created Admin:', admin.email);

        // 2. Create Student User
        const studentPassword = await bcrypt.hash('student123', 10);
        const student = await prisma.user.upsert({
            where: { email: 'student@mindora.com' },
            update: {},
            create: {
                email: 'student@mindora.com',
                name: 'Student User',
                password: studentPassword,
                role: 'STUDENT',
                class: '10',
            },
        });
        console.log('Created Student:', student.email);

        // 3. Create Olympiads
        const olympiads = [
            { name: 'NSO - National Science Olympiad', description: 'Premier science competition.' },
            { name: 'IMO - International Mathematics Olympiad', description: 'World championship math competition.' },
            { name: 'IEO - International English Olympiad', description: 'English language competition.' },
            { name: 'NCO - National Cyber Olympiad', description: 'Cyber concepts and knowledge.' }
        ];

        const createdOlympiads = [];
        for (const o of olympiads) {
            const olymp = await prisma.olympiad.upsert({
                where: { id: o.name }, // Using name as ID for upsert logic is tricky, better findFirst
                update: {},
                create: {
                    name: o.name,
                    description: o.description,
                    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                    endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
                    createdBy: admin.id,
                }
            }).catch(async () => {
                // Fallback if ID check fails (since we don't have unique name constraint)
                return await prisma.olympiad.findFirst({ where: { name: o.name } }) ||
                    await prisma.olympiad.create({
                        data: {
                            name: o.name,
                            description: o.description,
                            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
                            createdBy: admin.id,
                        }
                    });
            });
            createdOlympiads.push(olymp);
        }
        console.log(`Created/Found ${createdOlympiads.length} Olympiads`);

        // 4. Create Subjects, Topics, and Questions
        const allTopics = [];
        for (const sub of SUBJECTS) {
            const subject = await prisma.subject.create({
                data: {
                    name: sub.name,
                    description: sub.description,
                }
            });

            for (const top of sub.topics) {
                const topic = await prisma.topic.create({
                    data: {
                        subjectId: subject.id,
                        name: top.name,
                        summary: top.summary,
                        difficulty: top.difficulty,
                    }
                });
                allTopics.push(topic);

                // Create 5 questions per topic
                for (let i = 1; i <= 5; i++) {
                    await prisma.question.create({
                        data: {
                            topicId: topic.id,
                            text: `Sample Question ${i} for ${top.name}: What is the core concept of this topic?`,
                            type: 'mcq',
                            options: [
                                'Option A: Incorrect concept',
                                'Option B: Correct concept',
                                'Option C: Partially correct',
                                'Option D: Irrelevant'
                            ],
                            correctAnswer: 'Option B: Correct concept',
                            explanation: `This is the explanation for question ${i} in ${top.name}.`,
                            difficulty: i % 3 === 0 ? 'hard' : (i % 2 === 0 ? 'medium' : 'easy'),
                        }
                    });
                }
            }
        }
        console.log('Created Subjects, Topics, and Questions');

        // 5. Create Tests
        // 3 Upcoming Tests
        for (let i = 1; i <= 3; i++) {
            await prisma.test.create({
                data: {
                    title: `Weekly Mock Test ${i}`,
                    description: 'A comprehensive test covering recent topics.',
                    olympiadId: createdOlympiads[0].id,
                    startTime: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000), // +1, +2, +3 weeks
                    durationMinutes: 60,
                    isPublished: true,
                    isPaid: i === 3, // 3rd one is paid
                    price: i === 3 ? 99 : 0,
                    createdBy: admin.id,
                }
            });
        }

        // 10 Past Year Papers
        for (let year = 2014; year <= 2023; year++) {
            await prisma.test.create({
                data: {
                    title: `NSO Past Paper ${year}`,
                    description: `Official past year paper from ${year}.`,
                    olympiadId: createdOlympiads[0].id,
                    startTime: new Date(`${year}-11-15`),
                    endTime: new Date(`${year}-11-15`), // Already ended
                    durationMinutes: 60,
                    isPublished: true,
                    isPaid: false, // Past papers usually free or part of bundle
                    createdBy: admin.id,
                }
            });
        }
        console.log('Created Tests (Upcoming & Past Papers)');

        // 6. Link Questions to Tests
        const allQuestions = await prisma.question.findMany();
        const allTests = await prisma.test.findMany();

        for (const test of allTests) {
            // Select 10 random questions
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 10);

            for (let i = 0; i < selected.length; i++) {
                await prisma.testQuestion.create({
                    data: {
                        testId: test.id,
                        questionId: selected[i].id,
                        sequence: i + 1,
                        marks: 1, // Default marks
                    }
                });
            }
        }
        console.log('Linked Questions to Tests');

        console.log('Seeding finished.');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
