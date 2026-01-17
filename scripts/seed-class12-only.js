// Simplified seed script - Only Class 12 topics
// Run this with: node scripts/seed-class12-only.js

const { execSync } = require('child_process');

console.log('🚀 Seeding Class 12 subjects and topics only...\n');

const scripts = [
    { name: 'Subjects', file: 'seed-all-subjects.js' },
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
console.log('🎉 COMPLETE! Class 12 subjects and topics seeded.');
console.log('='.repeat(60));
console.log('\n📊 Summary:');
console.log('   ✅ 5 Subjects (Physics, Chemistry, Mathematics, Astronomy, Science)');
console.log('\n   📚 Class 12 (51 topics):');
console.log('      • Physics: 14 topics');
console.log('      • Chemistry: 16 topics');
console.log('      • Mathematics: 10 topics');
console.log('      • Astronomy: 11 topics');
console.log('\n🚀 Your Mindora platform is ready!');
console.log('   ✅ Class 12 students will see all 4 subjects with 51 topics');
console.log('   ✅ Admins can upload content to any topic');
console.log('   ✅ Content appears instantly for students\n');
