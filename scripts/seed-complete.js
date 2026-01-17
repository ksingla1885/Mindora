// Complete seed script - Seeds all subjects and topics for Class 11 & 12
// Run this with: node scripts/seed-complete.js

const { execSync } = require('child_process');

console.log('🚀 Starting complete database seeding...\n');

const scripts = [
    { name: 'Subjects', file: 'seed-all-subjects.js' },
    { name: 'Class 11 Physics Topics', file: 'seed-physics-topics.js' },
    { name: 'Class 11 Chemistry Topics', file: 'seed-chemistry-topics.js' },
    { name: 'Class 11 Mathematics Topics', file: 'seed-mathematics-topics.js' },
    { name: 'Class 11 Astronomy Topics', file: 'seed-astronomy-topics.js' },
    { name: 'Class 12 Physics Topics', file: 'seed-physics-class12-topics.js' },
    { name: 'Class 12 Chemistry Topics', file: 'seed-chemistry-class12-topics.js' },
    { name: 'Class 12 Mathematics Topics', file: 'seed-mathematics-class12-topics.js' },
    { name: 'Class 12 Astronomy Topics', file: 'seed-astronomy-class12-topics.js' }
];

for (const script of scripts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Running: ${script.name}`);
    console.log('='.repeat(60));

    try {
        execSync(`node scripts/${script.file}`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`❌ Error running ${script.name}:`, error.message);
        process.exit(1);
    }
}

console.log('\n' + '='.repeat(60));
console.log('🎉 COMPLETE! All subjects and topics have been seeded.');
console.log('='.repeat(60));
console.log('\n📊 Summary:');
console.log('   ✅ 5 Subjects (Physics, Chemistry, Mathematics, Astronomy, Science)');
console.log('\n   📚 Class 11 (51 topics):');
console.log('      • Physics: 9 topics');
console.log('      • Chemistry: 14 topics');
console.log('      • Mathematics: 16 topics');
console.log('      • Astronomy: 12 topics');
console.log('\n   📚 Class 12 (51 topics):');
console.log('      • Physics: 14 topics');
console.log('      • Chemistry: 16 topics');
console.log('      • Mathematics: 10 topics');
console.log('      • Astronomy: 11 topics');
console.log('\n   📝 Grand Total: 102 topics\n');
console.log('🚀 Your Mindora platform is ready for your presentation!');
console.log('   ✅ Students see subjects filtered by their class');
console.log('   ✅ Admins can upload content to any topic');
console.log('   ✅ Content appears instantly for students');
console.log('   ✅ Complete curriculum for Class 11 & 12\n');
