const fs = require('fs');
const path = require('path');

// Create docs directory if it doesn't exist
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
}

// Files to move
const files = [
    'ACTION_PLAN.md',
    'DOCUMENTATION_INDEX.md',
    'EXECUTIVE_SUMMARY.md',
    'FEATURE_COMPLETION_ANALYSIS.md',
    'PROJECT_STATUS.md',
    'QUICK_STATUS.md',
    'future.md'
];

// Move each file
files.forEach(file => {
    const source = path.join(__dirname, file);
    const dest = path.join(docsDir, file);

    if (fs.existsSync(source)) {
        fs.renameSync(source, dest);
        console.log(`Moved: ${file}`);
    } else {
        console.log(`Not found: ${file}`);
    }
});

console.log('Done!');
