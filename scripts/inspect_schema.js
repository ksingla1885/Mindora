const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../src/app/(admin)/admin/questions/page.jsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

const lines = pageContent.split('\n');
console.log(`Total lines in page.jsx: ${lines.length}`);

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('csv') || line.toLowerCase().includes('import') || line.toLowerCase().includes('upload')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
