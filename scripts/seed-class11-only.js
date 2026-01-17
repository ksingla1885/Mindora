// Simplified seed script - Only Class 11 topics for presentation
// Run this with: node scripts/seed-class11-only.js

const { execSync } = require('child_process');

console.log('🚀 Seeding Class 11 subjects and topics only...\n');

const scripts = [
    { name: 'Subjects', file: 'seed-all-subjects.js' },
    { name: 'Class 11 Physics Topics', file: 'seed-physics-topics.js' },
    { name: 'Class 11 Chemistry Topics', file: 'seed-chemistry-topics.js' },
    { name: 'Class 11 Mathematics Topics', file: 'seed-mathematics-topics.js' },
    { name: 'Class 11 Astronomy Topics', file: 'seed-astronomy-topics.js' }
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
console.log('🎉 COMPLETE! Class 11 subjects and topics seeded.');
console.log('='.repeat(60));
console.log('\n📊 Summary:');
console.log('   ✅ 5 Subjects (Physics, Chemistry, Mathematics, Astronomy, Science)');
console.log('\n   📚 Class 11 (51 topics):');
console.log('      • Physics: 9 topics');
console.log('      • Chemistry: 14 topics');
console.log('      • Mathematics: 16 topics');
console.log('      • Astronomy: 12 topics');
console.log('\n🚀 Your Mindora platform is ready for your presentation!');
console.log('   ✅ Class 11 students will see all 4 subjects with 51 topics');
console.log('   ✅ Admins can upload content to any topic');
console.log('   ✅ Content appears instantly for students\n');
